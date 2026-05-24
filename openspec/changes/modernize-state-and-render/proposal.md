## Why

Sau khi `cleanup-and-split` hoàn thành, codebase có module rõ ràng nhưng vẫn còn hai nợ kỹ thuật lớn cản trở mọi tính năng mới:

1. **State pipeline thiếu kỷ luật**: `gameState` chia làm hai nguồn — `useState` (React, để re-render UI) và một loạt `useRef` (entities, particles, texts, drops, scenery, camera, shake) bị mutate trực tiếp mỗi frame. `saveGame()` được gọi trong `useEffect([gameState])` → mỗi `setGameState(...)` ghi `JSON.stringify` toàn-state vào `localStorage` đồng bộ, có thể nhiều lần một giây. `loadGame(): any | null` không validate, không có version, không migrate. Khi load lại, các refs transient không sync với state đã save → có thể đẩy game vào trạng thái nửa vời.

2. **Render pipeline thủ công không scale**: Sau cleanup, mọi đường vẽ vẫn dùng Canvas2D thủ công với `ctx.drawImage`, `ctx.fillRect`, blend modes manual cho 100+ entities + particles. Pixi.js (đã có trong `node_modules` từ phase trước, nay đã gỡ — sẽ thêm lại đúng cách) cung cấp WebGL batching, sprite atlas, filters built-in, và scene graph chính thức. Việc tiếp tục code Canvas2D thủ công sẽ làm mọi optimization tiếp theo (post-processing, particle scaling, mobile FPS) trở nên tốn kém.

Phase này thay đổi internals nhưng phải giữ gameplay + visual contract với người chơi.

## What Changes

### Phần A — Save/State Pipeline Redesign

- **BREAKING (save format)**: Đổi save key từ `vltk_gemini_save_v1` sang `vltk_gemini_save_v2`. Save v1 cũ được auto-migrate khi load, nếu fail thì discard với toast notification (không silent corrupt).
- Định nghĩa rõ **Persistent State** vs **Transient State**:
  - Persistent (đi vào save): stage, gold, exp, player stats/equipment/level, quests, manuals, buffs, skills, livesPurchased, companion progress.
  - Transient (chỉ trong refs, không save): entities, particles, floating texts, drops, scenery, camera, shake, atkCd, comboTimer, rageTimer.
- Auto-save chỉ kích hoạt ở **checkpoint** rõ ràng: stage CLEARED, player level-up, equipment equip/unequip mua, skill point spent, quest claimed.
- Thay `useEffect([gameState])` blanket save bằng explicit `requestSave()` call ở các checkpoint.
- Thêm `version: 2` field vào save payload và `migrateSave(raw): GameState | null` function.
- `loadGame()` typed return `GameState | null` với runtime validation (lightweight — không thêm Zod dep, dùng manual `isValidGameState()` check shape critical fields).
- Xóa toàn bộ `useState` cho data thuần data-flow (entities, drops giữ trong ref); chỉ giữ `useState` cho data thực sự cần re-render UI.

### Phần B — Pixi.js Migration

- **BREAKING (internal API)**: Thay `<canvas>` element + Canvas2D `getContext('2d')` bằng Pixi `Application`. `GameCanvas.tsx` mount một Pixi app vào ref div.
- Tạo Pixi scene graph: `worldContainer` (camera-relative), `uiContainer` (screen-relative). Trong `worldContainer`: layers `terrainLayer`, `sceneryLayer`, `dropsLayer`, `entitiesLayer`, `particlesLayer`, `textsLayer`.
- Migration `render/world.ts` từ Canvas2D draw calls sang Pixi `Sprite`/`Graphics`/`Container` lifecycle. Mỗi entity giữ một `PIXI.Sprite` reference, update `x/y/scale` thay vì redraw.
- Particle system dùng `PIXI.ParticleContainer` cho batch render (nghìn particles, một draw call).
- Sect filter (glow, color tint) dùng `pixi-filters` (GlowFilter, ColorMatrixFilter) thay vì manual shadowBlur/globalCompositeOperation.
- Image processing (`removeCharacterBackground`, `removeBlackBackground`) chuyển sang chạy một lần khi load với `PIXI.Texture.from(canvas)` (offscreen canvas tạm thời rồi convert), kết quả texture cache.
- `drawHuman` được rewrite thành `buildPlayerSprite(sectId, equipment): PIXI.Container` — build một container có sprite + weapon overlay child, update transform thay vì redraw.

### Phần C — Image Loading Hardened

- Thay counter-based loader (vấn đề: image fail → loading screen vĩnh viễn) bằng `Promise.all` với explicit `onerror` handler.
- Failed image → load placeholder texture (1×1 magenta), continue with warning toast. Game không bao giờ stuck loading screen.
- Heavy image processing (`removeCharacterBackground` flood-fill) chuyển sang `requestIdleCallback` (fallback `setTimeout`) để không block main thread khi vào game.

## Capabilities

### New Capabilities
- `save-pipeline`: Quy tắc cho persistence — split persistent/transient state, checkpoint-based save, versioned save format với migration path.
- `pixi-render`: Quy tắc cho render layer dùng Pixi.js — scene graph layers, sprite lifecycle, particle batching, filter usage.
- `resilient-asset-loading`: Quy tắc cho image loading — Promise.all, error fallback, idle-time processing.

### Modified Capabilities
- `engine-modularity`: Cập nhật quy tắc layer để phản ánh Pixi (render layer giờ phụ thuộc vào `pixi.js` thay vì Canvas2D). Game layer ranh giới không đổi (vẫn render-free).

## Impact

- **Code thay đổi nặng**: `src/render/*` (rewrite Canvas2D → Pixi), `src/utils/storage.ts` (validation + version), `src/App.tsx` (loại bỏ blanket auto-save useEffect), `src/components/GameCanvas.tsx` (Pixi app mount).
- **Dependencies**: Thêm lại `pixi.js`, `@pixi/react` (nếu dùng React wrapper), `pixi-filters`. Lần này có justification.
- **Save format**: BREAKING ở key + structure. Migration cho v1 saves trên field-by-field basis.
- **Performance**: Kỳ vọng cải thiện FPS đáng kể ở stage 20+ khi particle/entity count cao. Mobile cũng được lợi.
- **Visuals**: Đầu ra phải tương đương về visual quality. Glow/blur có thể nhìn đẹp hơn nhờ filter shader nhưng phải khớp tone gốc.
- **Risk**: Cao. Pixi migration là rewrite render layer; thay đổi save format có thể wipe user progress nếu migration sai.
- **Rollback**: Phase A (save) có thể rollback bằng cách giữ song song `vltk_gemini_save_v1` key trong 1 release cycle. Phase B (Pixi) khó rollback một phần — phải merge sau khi đã verify kỹ trên feature branch dài.
- **Prerequisite**: `cleanup-and-split` MUST be merged trước. Phase này giả định cấu trúc thư mục `render/`, `game/`, `game/systems/` đã có.
- **Thứ tự implement đề xuất**: Save/State (A+C) trước (rủi ro thấp hơn, dùng được trên cấu trúc Canvas2D hiện tại); Pixi (B) sau (rủi ro cao, cần state pipeline đã ổn để debug isolation).
