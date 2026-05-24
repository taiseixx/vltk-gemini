## Context

`GameCanvas.tsx` đã đạt 3260 dòng và tích lũy mọi loại trách nhiệm: pixel-level image filtering, sprite caching, image loading orchestration, sect/element domain logic, mob spawning với scaling formula, character rendering procedurally cho 10 phái, game loop với physics + AI + combo + companion strike + drop pickup, render passes (terrain, scenery, entities, particles, UI), pointer handling, keyboard shortcuts, loading screen, và setup của một engine tự chế (`src/lib/cocos/index.ts`) gần như không được sử dụng.

Đồng thời, `package.json` khai báo 4 dependency lớn (`@google/genai`, `pixi.js`, `@pixi/react`, `pixi-filters`) không có import nào trong source. `README.md` và `metadata.json` quảng cáo "Gemini API server-proxy" trong khi `server.ts` chỉ trả về mảng JS hardcode.

Phase này thực hiện hai việc gắn liền nhau:
1. **Xóa code chết & sửa tuyên bố sai** — để codebase trở thành nguồn sự thật.
2. **Tách `GameCanvas.tsx`** theo ranh giới trách nhiệm rõ ràng — để phase sau (`modernize-state-and-render`) có nền tảng module hóa làm việc trên.

**Ràng buộc**:
- Project chưa có test suite tự động → mọi refactor phải có thể smoke-test thủ công.
- Project là một game canvas-based → mọi thay đổi render visible ngay, nên giữ pixel-perfect equivalence là yêu cầu.
- Repo là single-developer (theo cấu trúc và `metadata.json`) → không có CI/CD ràng buộc; merge có thể nhỏ và liên tiếp.

**Stakeholders**: maintainer chính, các coding agent đọc `AGENT.md`.

## Goals / Non-Goals

**Goals:**
- `GameCanvas.tsx` ≤ 400 dòng, chỉ chứa React glue (refs, RAF schedule, effect setup, pointer handlers).
- Không có dependency được khai báo mà không được import.
- Không có "engine tự chế" làm code chết — hoặc dùng thật sự hoặc xóa.
- README + metadata.json mô tả đúng hành vi runtime hiện tại.
- Cấu trúc thư mục `src/render/`, `src/game/systems/` được thiết lập làm chuẩn import cho phase sau.
- **Pixel-perfect parity**: sau refactor, gameplay + visuals + perf phải tương đương trước refactor trong smoke test thủ công.

**Non-Goals:**
- Không thay đổi gameplay, balance, hoặc visuals.
- Không sửa state architecture (refs vs state — đó là phase `modernize-state-and-render`).
- Không migrate sang Pixi.js (phase sau).
- Không thêm test framework (có thể là phase riêng).
- Không tích hợp Gemini thật (chỉ sửa documentation để khớp với hiện trạng).
- Không động vào `src/utils/comboHelper.ts`, `companionHelper.ts`, `economy.ts`, `quest.ts` ngoài việc cập nhật import path.

## Decisions

### D1. Xóa `src/lib/cocos/` hoàn toàn, thay thế use case duy nhất

**Quyết định**: Xóa thư mục `src/lib/cocos/` và tất cả 10 references trong `GameCanvas.tsx`.

**Sử dụng hiện tại**: Theo grep, `cc.` xuất hiện đúng 10 lần — chỉ trong một code path tạo damage label. `cc.ParticleSystem` được `addChild` nhưng không bao giờ `spawn()`. `cc.director.update(dt)` được gọi mỗi frame nhưng scene tree gần như rỗng.

**Thay thế**: Damage label đã có cơ chế song song trong `textsRef.current.push({ x, y, text, color, life })` với `render` đã vẽ floating texts. Code path duy nhất dùng `cc.Label` chỉ cần thay bằng `textsRef.current.push(...)`.

**Tại sao không "dùng cc thật"?**: Để hoàn thiện Cocos clone đến mức scale-graph render hoàn chỉnh cần >1000 dòng thêm và sẽ trùng lặp với Pixi.js (phase sau). Lựa chọn rẻ nhất là xóa.

**Alternatives:**
- *Giữ và mở rộng cc* → bị bỏ qua: chi phí maintenance cao, sẽ bị thay thế bởi Pixi.
- *Giữ nguyên không động vào* → bị bỏ qua: 426 dòng dead code làm khó đọc.

### D2. Cấu trúc thư mục `render/` vs `game/` vs `components/`

**Quyết định**: Tách thành 3 layer dựa trên hướng phụ thuộc:

```
components/  (React layer — chỉ tầng này biết về React)
    ↓ imports
game/        (Pure TypeScript logic — không biết về React/DOM/Canvas)
    ↓ imports
render/      (Canvas drawing — biết về Canvas2D nhưng không biết về React)
```

**Quy ước import**:
- `render/*` không được import `react`, `game/*`.
- `game/*` không được import `react`, `render/*`, hoặc `canvas` APIs (chỉ data + math).
- `components/*` có thể import cả hai.
- Vi phạm sẽ được phát hiện bằng `tsc --noEmit` (xem D5).

**Tại sao chia làm 3 thay vì 2?**: Game logic (spawn, combat, skills) độc lập với rendering — có thể dùng cho headless simulation, server-side validation. Render logic (drawHuman, drawTerrain) cần Canvas API nhưng không cần biết về game state shape ngoài tham số được pass. Giữ chúng tách giúp test/refactor dễ hơn.

**Alternatives:**
- *Tách theo feature (sect/, combat/, etc.)* → bị bỏ qua: render và logic của cùng feature có lifecycle khác nhau (render đổi thường xuyên, logic thì không).
- *Tất cả vào `lib/`* → bị bỏ qua: không nói rõ ranh giới React/non-React.

### D3. `game/systems/*` chứ không phải `game/*` flat

**Quyết định**: Tạo thư mục con `game/systems/` cho các hàm chạy mỗi tick (movement, combat, skills, combo, companion, drops). Các hàm static (spawn, elements) ở thẳng `game/`.

**Lý do**: 6 system files đều có signature tương tự `(state, dt, refs) → void`. Đặt cùng thư mục con để dễ tìm và khuyến khích nhất quán signature. Phase sau (`modernize-state-and-render`) có thể chuẩn hóa signature này.

### D4. Image processing để worker hay giữ main thread?

**Quyết định**: Giữ ở main thread cho phase này. Chỉ tách module, không thay đổi thread model.

**Lý do**: Mục tiêu phase này là "không thay đổi hành vi". Move sang worker là semantic change (lifecycle, async order khác). Đó thuộc phase sau nếu profiler chỉ ra cần thiết.

**Trade-off**: Vẫn block main thread khi load lần đầu. Chấp nhận.

### D5. Cách xác minh ranh giới layer mà không cần ESLint rule

**Quyết định**: Tạm thời dựa vào quy ước + code review. Không thêm dependency lint mới phase này.

**Lý do**: Project chưa có ESLint config (chỉ có `tsc --noEmit`). Thêm `eslint-plugin-boundaries` là một quyết định lớn hơn (scope, config, CI integration). Phase sau có thể thêm nếu cần.

**Trade-off**: Có thể có vi phạm ranh giới sớm. Mitigation: tasks.md có một check list import boundary check thủ công sau khi tách.

### D6. Cập nhật `README.md` và `metadata.json` thay vì xóa

**Quyết định**: Giữ structure README, thay phần mô tả Gemini bằng nội dung trung thực: "Endpoint `/api/encounter` hiện trả về dữ liệu pre-configured local. Tích hợp Gemini thật sẽ thuộc phase sau." Đối với `metadata.json`, **giữ** `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` nếu nó là cờ AI Studio runtime cần thiết, nhưng comment trong code phải phản ánh đúng hiện trạng.

**Lý do**: `metadata.json` có vẻ là cấu hình AI Studio infrastructure, không phải tài liệu. Sửa nó có thể phá nền tảng deploy. README thì hoàn toàn nội bộ và phải sửa.

**Open Question**: Cần xác nhận `metadata.json` có ảnh hưởng đến AI Studio runtime hay không (xem Open Questions).

### D7. Migration tăng dần qua nhiều commit nhỏ

**Quyết định**: Refactor đi qua các checkpoint, mỗi checkpoint là một commit độc lập có thể build + chạy:

```
Checkpoint 1: Xóa cocos + dead deps + sửa docs   (xóa, không di chuyển)
Checkpoint 2: Tách render/imageProcessing + imageCache
Checkpoint 3: Tách render/spriteLoader
Checkpoint 4: Tách render/character (drawHuman)
Checkpoint 5: Tách render/world (terrain, scenery, particles, texts)
Checkpoint 6: Tách game/elements + game/spawn
Checkpoint 7: Tách game/systems/* lần lượt (movement → combat → skills → combo → companion → drops)
Checkpoint 8: GameCanvas chỉ còn React glue
Checkpoint 9: Smoke test full play 5 stages + verify perf
```

**Lý do**: Project không có test tự động. Mỗi checkpoint nhỏ giúp bisect khi có regression. Mỗi commit phải `npm run dev` chạy được + click qua 1 stage không có error console.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Move code đột ngột làm vỡ visual subtle (z-order render, timing) | Mỗi checkpoint commit riêng. Smoke test sau mỗi checkpoint. Giữ thứ tự render passes y nguyên khi tách. |
| `cc.sequence(...)` có animation logic mà visible bằng mắt thường | Damage label fade-up đang dùng cc. Sau khi thay thế bằng textsRef, verify fade timing tương đương (đã có life-based fade trong existing draw code). |
| Image cache key conflicts nếu signature thay đổi | Giữ nguyên signature `getCachedFilteredImage(src, type, tolerance, callback)`. Không refactor signature trong phase này. |
| Import path churn làm git diff khó đọc | Sử dụng path alias `@/render/*`, `@/game/*` (đã có `@/*` trong tsconfig). Một commit riêng cho việc thêm alias trước khi di chuyển. |
| Maintainer khác đang viết code trên cùng GameCanvas | Tách trong một feature branch ngắn, merge sớm. Khuyến khích freeze GameCanvas trong thời gian này. |
| `metadata.json` capability flag bị sửa nhầm → vỡ AI Studio deploy | Không sửa `metadata.json` ở phase này; chỉ sửa README. Theo dõi Open Question Q1. |
| `tsc --noEmit` không phát hiện boundary violation | Manual code review trước khi merge. Có thể tạo `tsconfig.boundaries.json` riêng sau (out of scope). |
| 31 image loads sequential dễ bị stuck nếu một image fail | Đã có sẵn TODO trong phase sau (`modernize-state-and-render`); chỉ tách module ở phase này, không sửa loader. |

## Migration Plan

### Pre-flight
1. Tạo branch `refactor/cleanup-and-split`.
2. `npm install` để verify build hiện tại pass: `npm run lint && npm run build`.
3. Manual smoke test stage 1-3 với một sect (vd: Thiếu Lâm) — note FPS, screenshot key frames.
4. Tag commit `pre-cleanup` trên branch để có rollback point.

### Execution (theo D7 checkpoints)
- Mỗi checkpoint = 1 commit. Sau mỗi commit:
  - `npm run lint` phải pass.
  - `npm run dev` phải khởi động không error.
  - Smoke test 1 stage trên một sect bất kỳ.
- Nếu một checkpoint fail smoke test, revert checkpoint đó và phân tích trước khi tiếp tục.

### Post-merge
- Manual smoke test full 10 stages × 2 sects (1 melee, 1 ranged).
- So sánh FPS với screenshot pre-cleanup (xem perfLogger console output).
- Cập nhật `AGENT.md` để phản ánh cấu trúc thư mục mới (TL;DR section).

### Rollback
- Vì mỗi checkpoint là một commit riêng, rollback từng phần: `git revert <sha>`.
- Trong trường hợp xấu nhất, `git reset --hard pre-cleanup`.

## Open Questions

- **Q1**: `metadata.json` có phải config runtime của AI Studio không? Có an toàn để chỉnh `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` không? → Cần check AI Studio docs hoặc test deploy với metadata khác.
- **Q2**: `drawHuman` có vẽ overlay procedural lên trên sprite PNG hay không (double rendering)? Cần xác nhận khi đọc kỹ trong checkpoint 4 — nếu đúng thì đó là behavioral bug nhưng vẫn giữ vì non-goal là không sửa visuals.
- **Q3**: Có ai dùng `cc.Director` từ DevTools console không? (gần như chắc chắn không, nhưng confirm với maintainer trước khi xóa).
- **Q4**: Path alias `@/render/*` vs relative `../render/*` — chọn cái nào nhất quán? Hiện codebase dùng relative. Đề xuất: giữ relative trong phase này để tránh churn, alias hóa ở phase sau.
