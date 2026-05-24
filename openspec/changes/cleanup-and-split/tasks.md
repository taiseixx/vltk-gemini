## 1. Pre-flight & Branch Setup

- [x] 1.1 Tạo branch `refactor/cleanup-and-split` từ main
- [x] 1.2 Verify build hiện tại: `npm install && npm run lint && npm run build` đều pass
- [~] 1.3 Smoke test pre-cleanup: **SKIPPED per user decision** — accepting risk of no pixel/FPS parity check at end
- [x] 1.4 Commit `chore: pre-cleanup checkpoint` (empty commit) và tag `pre-cleanup`

## 2. Checkpoint 1 — Xóa dead deps và cocos engine

- [x] 2.1 Sửa `src/components/GameCanvas.tsx`: xóa 3 dòng `import { cc } from "../lib/cocos"`, `cocosSceneRef`, `cocosParticlesRef`, `useEffect` setup cocos (≈10 dòng)
- [x] 2.2 Thay thế đoạn dùng `cc.Label + cc.sequence(...)` (quanh dòng 1519-1536) bằng `textsRef.current.push({ id, x, y, text, color, life })` với life tương đương duration animation cũ — **NOTE**: existing `textsRef.current.push` block immediately above the cocos block already does this with `life: pRef.rageActive ? 1.6 : 1.2`. Cocos block was a duplicate. Removed it.
- [x] 2.3 Xóa `cc.director.update(dt)` ở game loop (dòng 2043)
- [x] 2.4 Xóa thư mục `src/lib/cocos/` hoàn toàn
- [x] 2.5 Gỡ `@google/genai`, `pixi.js`, `@pixi/react`, `pixi-filters` khỏi `package.json` dependencies
- [x] 2.6 Chạy `npm install` để regenerate `package-lock.json` — 58 packages removed. **Side-effect**: had to add `@types/react` + `@types/react-dom` to devDependencies (they were transitively pulled in by `@pixi/react` peer deps and the project never declared them itself)
- [x] 2.7 Verify: `grep -r "cc\." src/` zero matches, `grep -r "from '\(pixi\|@pixi\|@google/genai\)" src/ server.ts vite.config.ts` zero matches
- [x] 2.8 `npm run lint && npm run build` pass — JS bundle 580 KB → 574 KB
- [x] 2.9 Smoke test stage 1: damage label vẫn fade-up bình thường, không error console — user confirmed OK
- [x] 2.10 Commit `refactor: remove cocos engine and unused dependencies` — commit 71eb743

## 3. Checkpoint 2 — Tách render/imageProcessing và render/imageCache

- [x] 3.1 Tạo `src/render/imageProcessing.ts`
- [x] 3.2 Move `removeCharacterBackground` (GameCanvas dòng 59-135) sang module mới, export
- [x] 3.3 Move `removeBlackBackground` (GameCanvas dòng 137-197) sang module mới, export
- [x] 3.4 Tạo `src/render/imageCache.ts`
- [x] 3.5 Move `GLOBAL_IMAGE_CACHE` (dòng 200) và `getCachedFilteredImage` sang module mới, export. Import `removeCharacterBackground`/`removeBlackBackground` từ `imageProcessing.ts`
- [x] 3.6 Trong `GameCanvas.tsx`, replace local declarations bằng `import { getCachedFilteredImage } from '../render/imageCache'`
- [x] 3.7 Verify import boundary: `imageProcessing.ts` không import từ `react/game` — grep clean
- [x] 3.8 `npm run lint && npm run build` pass
- [x] 3.9 Smoke test: ảnh sprite load đúng, không có sprite trắng/vỡ — user confirmed (tạm OK, không thấy regression)
- [x] 3.10 Commit `refactor: extract image processing and cache into render layer` — commit 7cf222a

## 4. Checkpoint 3 — Tách render/spriteLoader

- [x] 4.1 Tạo `src/render/spriteLoader.ts`. Định nghĩa type `SpriteManifest` mô tả danh sách image cần load (key, src path, filter type, tolerance)
- [x] 4.2 Export hàm `loadAllSprites(manifest, onProgress): Promise<Record<string, CanvasImageSource>>` — internally dùng `getCachedFilteredImage` nhưng wrap trong Promise
- [x] 4.3 Trong `GameCanvas.tsx`, replace `useEffect` loader (dòng 308-412) bằng một useEffect ngắn: build manifest, gọi `loadAllSprites`, set vào refs khi resolve
- [x] 4.4 Giữ counter `loadedResourcesRef.current` để loading screen vẫn hoạt động — done via `onProgress` callback. `incrementLoaded` helper đã xóa vì không còn dùng.
- [x] 4.5 `npm run lint && npm run build` pass
- [x] 4.6 Smoke test: loading screen vẫn hiển thị progress, vào game không stuck — user confirmed loading behavior identical to pre-refactor (overlap bug is pre-existing, not regression). Eager ref assignment via `onSpriteLoaded` callback preserves exact original behavior.
- [x] 4.7 Commit `refactor: extract sprite loader into render layer` — commit a5c1e2b

## 5. Checkpoint 4 — Tách render/character (drawHuman)

- [x] 5.1 Tạo `src/render/character.ts`
- [x] 5.2 Move `drawHuman` (≈dòng 476-795) sang module mới với signature `drawHuman(ctx, params: DrawHumanParams)` — params chứa primitives + pre-resolved sectId + pre-resolved sprite
- [x] 5.3 NOTE: Player không có field `sectId` trên type — chỉ có `color`. Giữ `getSectIdFromColor` ở GameCanvas (Checkpoint 7 sẽ move sang game/elements.ts). Caller derives sectId via helper `resolveSpriteForEntity(color, isBoss)` returning `{ sectId, sprite }`.
- [x] 5.4 Update 2 call sites: entity render + player render → cả hai gọi `resolveSpriteForEntity` rồi pass result + primitives qua `DrawHumanParams`
- [x] 5.5 `npm run lint && npm run build` pass
- [~] 5.6 Smoke test: BYPASSED per user — pushing through to CP8
- [x] 5.7 Commit `refactor: extract character rendering into render/character.ts` — commit d6fe7c7

## 6. Checkpoint 5 — Tách render/world (terrain, scenery, particles, texts, loading)

- [x] 6.1 Tạo `src/render/world.ts`
- [x] 6.2 Move `drawLoadingScreen` + TIPS array sang `render/world.ts`
- [x] 6.3 PARTIAL — Move `drawParticles(ctx, particles, cx, cy, viewWidth, viewHeight)` + `drawFloatingTexts(ctx, texts, cx, cy)` sang `render/world.ts`. **NOTE**: `drawTerrain` và `drawScenery` chưa tách (chúng đọc 8+ image refs, cần param bundle hoặc context object — defer sang change sau để giảm risk).
- [x] 6.4 Trong `render()`, replace particles block + floating texts block bằng calls. Render order giữ y nguyên (terrain → scenery → entities → particles → texts → UI)
- [x] 6.5 `npm run lint && npm run build` pass
- [~] 6.6 Smoke test: BYPASSED per user
- [x] 6.7 Commit `refactor: extract world rendering passes into render/world.ts` — commit a1d8a9a

## 7. Checkpoint 6 — Tách game/elements và game/spawn

- [x] 7.1 Tạo `src/game/elements.ts`: `getSectIdFromColor`, `getSectElement`, `getElementalMultipliers` (3 pure functions, all using shared `Element` type)
- [x] 7.2 Tạo `src/game/spawn.ts`: `getBossCount`, `getMobsTotal`, `spawnWave`, `spawnSubBosses`, `spawnFinalBosses` (incl. `WUXIA_BOSS_NAMES` const). All accept primitives (`stage`, `playerX`, `playerY`) — caller assigns return value + fires notifications.
- [x] 7.3 GameCanvas: replaced local spawn function bodies with thin wrappers that call the pure version, append to entitiesRef, and fire addNotification. Call sites at lines 520/527/535 unchanged.
- [x] 7.4 Boundary check passed: `game/*` không import react/render — grep clean
- [x] 7.5 `npm run lint && npm run build` pass
- [~] 7.6 Smoke test: BYPASSED per user
- [x] 7.7 Commit `refactor: extract spawn and elements into game layer` — commit c9020c7

## 8. Checkpoint 7 — Tách game/systems/* lần lượt

Mỗi sub-checkpoint là một commit riêng. Phải đảm bảo gameplay không thay đổi giữa từng sub-checkpoint.

- [ ] 8.1 Tạo `src/game/systems/movement.ts`. Move logic player movement step (tìm trong `update()` đoạn xử lý `player.targetX/targetY`, `player.moving`, mob movement toward player). Signature: `tickMovement(state, dt, entities): void`. Commit.
- [ ] 8.2 Tạo `src/game/systems/combat.ts`. Move logic basic attack + damage application + dead entity removal. Signature `tickCombat(state, dt, entities, particles, texts): void`. Commit.
- [ ] 8.3 Tạo `src/game/systems/skills.ts`. Move skill cast + cooldown decrement + manaCost subtract. Commit.
- [ ] 8.4 Tạo `src/game/systems/combo.ts`. Wire với `src/utils/comboHelper.ts` (giữ utils nguyên). Commit.
- [ ] 8.5 Tạo `src/game/systems/companion.ts`. Move companion AI strike (dòng 2046-2101 trong loop). Commit.
- [ ] 8.6 Tạo `src/game/systems/drops.ts`. Move drop pickup + equipment generation. Commit.
- [ ] 8.7 Sau cả 6 commits, smoke test full stage 1 → stage 10 với 1 sect. Verify mọi system hoạt động.

## 9. Checkpoint 8 — GameCanvas chỉ còn React glue

- [ ] 9.1 Đếm dòng `wc -l src/components/GameCanvas.tsx` — phải ≤ 400
- [ ] 9.2 Đọc lại file, verify chỉ còn: imports, props interface, hooks (useRef, useState), useEffect setup (sprite load, RAF schedule, resize, keydown), pointer handlers, return JSX
- [ ] 9.3 Nếu vẫn còn business logic, identify và move tiếp
- [ ] 9.4 `npm run lint && npm run build` pass
- [ ] 9.5 Commit `refactor: GameCanvas reduced to React glue (<400 lines)`

## 10. Checkpoint 9 — Documentation & boundary verification

- [ ] 10.1 Sửa `README.md`: thay phần Gemini banner và "Set the GEMINI_API_KEY..." bằng disclaimer trung thực: endpoint `/api/encounter` hiện trả về local data
- [ ] 10.2 Sửa `server.ts`: comment ở `/api/encounter` handler ghi rõ "Returns locally pre-configured encounters. Real Gemini integration not yet wired — insertion point marked TODO."
- [ ] 10.3 Sửa `AGENT.md` section 0 TL;DR để phản ánh:
  - `AI: not yet integrated — /api/encounter returns local pre-configured data`
  - Cấu trúc thư mục mới (render/, game/, game/systems/)
- [ ] 10.4 Thêm note disclosure trong `README.md` HOẶC `AGENT.md` về `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` flag trong metadata.json (forward declaration vs current impl)
- [ ] 10.5 Boundary check manual: `grep -r "from 'react'" src/render/ src/game/` zero matches, `grep -rE "import.*from.*'.*render" src/game/` zero matches, `grep -rE "getContext\|CanvasRenderingContext2D" src/game/` zero matches
- [ ] 10.6 Commit `docs: align README, server, AGENT.md with current implementation`

## 11. Final Verification

- [ ] 11.1 `npm run lint && npm run build` pass
- [ ] 11.2 Smoke test full: 2 sects (1 melee Thiếu Lâm, 1 ranged Đường Môn), each play stage 1 → 10
- [ ] 11.3 So sánh FPS với screenshot pre-cleanup — phải tương đương (±5%)
- [ ] 11.4 Compare 5 screenshot mốc với pre-cleanup — visual parity
- [ ] 11.5 Verify save/load: clear save, chơi 1 stage, refresh, click "tiếp tục" → state khôi phục đúng (đây là behavior cũ, phase này không thay đổi)
- [ ] 11.6 `npm ls` không list `@google/genai`, `pixi.js`, `@pixi/react`, `pixi-filters`
- [ ] 11.7 `wc -l src/components/GameCanvas.tsx` ≤ 400
- [ ] 11.8 Tag commit cuối là `post-cleanup-and-split`
- [ ] 11.9 Tạo PR / merge vào main

## 12. Post-merge

- [ ] 12.1 Update `AGENT.md` Section "Cấu Trúc Thư Mục" với layout mới (render/, game/, game/systems/) và quy tắc import boundary 3-layer
- [ ] 12.2 Verify `openspec` change archive workflow (sẽ chạy `/opsx:archive` khi all tasks done)
