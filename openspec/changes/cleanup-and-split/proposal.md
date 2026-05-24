## Why

Codebase hiện trạng có hai vấn đề cấu trúc nghiêm trọng làm chậm mọi thay đổi tiếp theo:

1. **Phụ thuộc & code chết quy mô lớn**: `@pixi/react`, `pixi.js`, `pixi-filters`, `@google/genai` được khai báo trong `package.json` nhưng không có file nào import. `src/lib/cocos/index.ts` (426 dòng — một scene-graph engine tự chế) chỉ được sử dụng ~10 lần cho duy nhất một floating damage label. README + `metadata.json` quảng cáo tích hợp Gemini nhưng `server.ts` chỉ trả về mảng hardcode. Đây là khoảng cách giữa "tuyên bố" và "thực tế" — gây hiểu lầm cho maintainer và làm tăng kích thước bundle.

2. **God Component**: `src/components/GameCanvas.tsx` dài 3260 dòng, ôm trọn: pixel image processing, image cache, sect/element lookup, mob spawning, character drawing, game loop update, render passes, pointer handling, loading screen, Cocos setup. Việc thêm bất cứ tính năng nào hiện cũng đòi hỏi điều hướng trong một file gần như không thể grep được. Mỗi lần edit có rủi ro phá vỡ một system khác trong cùng file.

Cleanup này phải đi trước mọi refactor lớn (save/state, Pixi migration) — vì chúng đều cần một mã nguồn đã được tách module rõ ràng làm điểm xuất phát.

## What Changes

### Phần A — Xóa code chết (không thay đổi hành vi)

- **BREAKING (chỉ với package.json)**: Gỡ `@google/genai`, `pixi.js`, `@pixi/react`, `pixi-filters` khỏi `dependencies`.
- Xóa thư mục `src/lib/cocos/` và mọi import liên quan trong `GameCanvas.tsx`.
- Thay thế các trường hợp dùng `cc.Label` (1 chỗ duy nhất) bằng floating text đã có sẵn trong `textsRef`.
- Xóa `cocosSceneRef`, `cocosParticlesRef`, và `useEffect` setup của cc.
- Cập nhật `README.md` và `metadata.json` để phản ánh đúng: hiện chưa tích hợp Gemini, endpoint `/api/encounter` trả về dữ liệu local pre-configured (tính năng tích hợp thật sẽ thuộc phase sau).
- Giữ nguyên file `server.ts` — chỉ cập nhật comment để khớp với hành vi thực.

### Phần B — Tách `GameCanvas.tsx` thành các module có trách nhiệm rõ ràng

Tạo cây thư mục mới dưới `src/`:

```
src/
├── render/
│   ├── imageProcessing.ts   (removeCharacterBackground, removeBlackBackground)
│   ├── imageCache.ts        (GLOBAL_IMAGE_CACHE, getCachedFilteredImage)
│   ├── spriteLoader.ts      (Promise.all loader với onerror handling)
│   ├── character.ts         (drawHuman + sect-specific overlays)
│   └── world.ts             (drawTerrain, drawScenery, drawParticles, drawTexts, drawLoadingScreen)
├── game/
│   ├── elements.ts          (getSectElement, getElementalMultipliers)
│   ├── spawn.ts             (spawnWave, spawnSubBosses, scaling formulas, getMobsTotal, getBossCount)
│   └── systems/
│       ├── movement.ts      (player + mob movement step)
│       ├── combat.ts        (basic attack, damage application)
│       ├── skills.ts        (skill cast + cooldown)
│       ├── combo.ts         (combo wiring với comboHelper.ts)
│       ├── companion.ts     (companion AI strike)
│       └── drops.ts         (drop pickup + equipment generation)
└── components/
    └── GameCanvas.tsx       (≈300 dòng: canvas ref, RAF loop, pointer, useEffect setup)
```

`GameCanvas.tsx` sau khi tách:
- Chỉ giữ React glue: useRef của canvas, RAF schedule, pointer/keyboard handlers, resize observer.
- Game loop gọi xuống `game/systems/*` cho mỗi tick.
- Render gọi xuống `render/world.ts` và `render/character.ts`.

Refactor này **không thay đổi gameplay hay visuals** — chỉ thay đổi vị trí file.

## Capabilities

### New Capabilities
- `engine-modularity`: Định nghĩa ranh giới giữa các module game engine (render layer, game systems layer, React layer) và quy ước import.
- `dependency-hygiene`: Yêu cầu mỗi dependency trong `package.json` phải có import thực sự; mọi tuyên bố trong README/metadata phải khớp hành vi runtime.

### Modified Capabilities
<!-- Không có spec hiện hữu — đây là project lần đầu áp dụng OpenSpec. -->

## Impact

- **Code bị xóa**: `src/lib/cocos/index.ts` (426 dòng), `cc.*` references trong `GameCanvas.tsx` (10 chỗ), 4 entries trong `package.json` dependencies.
- **Code bị di chuyển**: ~2900 dòng từ `GameCanvas.tsx` sang các module mới. `GameCanvas.tsx` còn ~300 dòng.
- **Code bị sửa**: `README.md`, `metadata.json` (Gemini description), `package.json` (deps + scripts giữ nguyên).
- **Bundle size**: Giảm đáng kể (pixi alone là ~600KB minified).
- **Hành vi runtime**: Không thay đổi — đây là refactor thuần.
- **Rủi ro**: Trung bình. Việc tách module trong khi giữ nguyên hành vi yêu cầu test thủ công kỹ lưỡng do project chưa có test suite tự động.
- **Phụ thuộc ngược dòng**: Đây là điều kiện tiên quyết cho `modernize-state-and-render`.
