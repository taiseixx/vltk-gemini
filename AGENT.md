# AGENT.md — VLTK Roguelite Game Development Guide

> **Đây là file hướng dẫn bắt buộc cho mọi coding agent khi làm việc với dự án Võ Lâm Roguelite.**
> Đọc TOÀN BỘ file này TRƯỚC KHI bắt đầu bất kỳ task phát triển hay sửa đổi nào.
> Cập nhật file này sau mỗi lần bổ sung tính năng lớn hoặc quy chuẩn kiến trúc mới.

---

## 0. TL;DR — Đọc Ngay Để Nắm Cốt Lõi

```yaml
Stack   : React 18 + Vite + Custom HTML5 2D Canvas Renderer
Theme   : Võ Lâm Truyền Kỳ — 10 phái chính tông (Thiếu Lâm, Võ Đang, Nga Mi, Cái Bang, Đường Môn, Ngũ Độc,...)
Genre   : Roguelite Survival / Auto-combat — di chuyển rà rương, đánh địch, dọn quái, chiêu mộ Đồng Hành, sưu tầm Bí Kíp
AI      : Google Gemini API (Server-side proxy `/api/encounter`) — Tự động sinh cuộc Kỳ Ngộ Giang Hồ dựa trên phái và trạng thái người chơi
Build   : Vite + Esbuild (Standalone production-ready full-stack container on port 3000)
Linter  : ESLint (`npm run lint` / `tsc --noEmit` check loại bỏ type-error)
```

**Quy tắc tối thượng:**
1. **Tuyệt đối không để lộ API Key:** Mọi cuộc gọi Gemini API đều **phải** được thực hiện ở server-side (`/server.ts`).
2. **Luôn có Fallback Ngoại Tuyến (Offline-Capable):** Tránh dừng game hay ném lỗi đỏ lòm khi trúng giới hạn 429 Quota Limit của Gemini Free Tier. Sử dụng bộ sinh Kỳ Ngộ cục bộ `getLocalEncounters` tích hợp sẵn trong `server.ts`.
3. **Quản lý state trung thực:** State tổng thể là `GameState` được định nghĩa trong `src/types.ts`. Mutation diễn ra mượt mà thông qua `setGameState` trong `src/App.tsx`.

---

## 1. Tầm Nhìn Dự Án & Trụ Cột Thiết Kế

### 1.1 Tầm Nhìn (Vision)

**VLTK Roguelite** tái hiện trải nghiệm huyền thoại Võ Lâm Truyền Kỳ dậm chất võ hiệp, kết hợp với các vòng lặp hồi hộp của dòng game Roguelite hiện đại (Survivor, bento unlocks, buybacks). Người chơi điều khiển đệ tử môn phái vượt qua các ải tràn đầy quái vật, đối đầu với Thủ Lĩnh, săn lùng trang bị nhiều phẩm chất, tu dưỡng Bí Kíp Sư Môn và rinh về Ngân Lượng vàng ròng.

### 1.2 Trụ Cột Thiết Kế

| Trụ Cột | Nội Dung Triển Khai |
| :--- | :--- |
| **10 Phái Chính Tông** | Đồ sộ, cân bằng ngũ hành, mỗi phái có chỉ số tiềm năng và kĩ năng combo đỉnh tâm riêng. |
| **Custom Canvas Engine** | Hiệu năng cực cao nhờ vẽ trực tiếp tệp ảnh Sprite, xử lý triệt để nền đen/nền đục bằng bộ lọc khử ảnh động (`removeCharacterBackground`). |
| **Kỳ Ngộ Độc Đắc** | Tận dụng AI để vẽ ra những tình huống hỷ nộ ái ố trên giang hồ có ảnh hưởng tăng giảm máu/vàng của người chơi. |
| **Thương Nhân Vong Xuyên** | Vòng lặp mua sinh mạng, tầm bảo trang bị giữa mỗi ải, kịch tính tăng giá theo hệ số ải. |

---

## 2. Các Lệnh Điều Hành Dự Án

```bash
# Cài đặt toàn bộ thư viện cần thiết
npm install

# Khởi chạy máy chủ phát triển (Gộp cả Express Server & Vite middleware trên cổng 3000)
npm run dev

# Biên dịch ứng dụng bản Production (Vite build + CJS Server)
npm run build

# Khởi chạy bản Production dựng sẵn
npm run start

# Chạy kiểm tra lỗi cú pháp và phân loại kiểu dữ liệu
npm run lint
```

---

## 3. Kiến Trúc Tổ Chức Thư Mục

```
/
├── server.ts                  # Máy chủ Express gộp API Kỳ Ngộ (/api/encounter) và Vite mode.
├── package.json               # Quản lý script khởi chạy & dependencies.
├── metadata.json              # Khai báo cấu hình quyền hạn và major capabilities ứng dụng.
├── src/
│   ├── App.tsx                # Giao diện chính điều phối trạng thái, auto-save, nạp tài nguyên.
│   ├── main.tsx               # Điểm kết nối React 18 khởi thủy.
│   ├── types.ts               # Khai báo kiểu dữ liệu toàn cục (GameState, MartialManual, Companion, etc.).
│   ├── constants.ts           # Định nghĩa 10 đại phái, bảng màu phẩm bửu, hằng số bản đồ.
│   ├── index.css              # Tệp CSS nhập Tailwind CSS chỉnh sửa đồng nhất.
│   │
│   ├── components/            # Các thành phần giao diện trực quan
│   │   ├── GameCanvas.tsx     # Bộ nhân xử lý trò chơi - Vẽ hoạt họa, phím di chuyển, combo đòn thế, hạt rực rỡ.
│   │   ├── HUD.tsx            # Hiển thị thanh máu (HP), chân khí (MP), cấp độ và nút cài đặt.
│   │   ├── Sidebar.tsx        # Panel nhân vật chính: Xem và mặc Trang Bị, Tu bồi Bí Kíp võ công.
│   │   ├── SkillBar.tsx       # Hiển thị kĩ năng, thời gian hồi (cooldown), nút bật/tắt Tự Động (Auto-play).
│   │   ├── QuestTracker.tsx   # Theo dõi danh sách Nhiệm vụ giang hồ (Tống Kim, Tiêu Diệt, Hộ Tống).
│   │   ├── StageClearOverlay.tsx # Hiển thị thưởng Vượt Ải (Kỳ Ngộ Nhập Môn) & Cửa hàng Vong Xuyên.
│   │   ├── SectSelection.tsx  # Giao diện chọn 10 môn phái khi bắt đầu lượt chơi mới (Run).
│   │   ├── StatsPopup.tsx     # Bảng nâng điểm tiềm năng (Sức mạnh, Thân pháp, Ngoại công, Nội công, Linh lực).
│   │   └── ShopOverlay.tsx    # Cửa hàng giao dịch mua bán trang bị thu được.
│   │
│   └── utils/                 # Hàm tiện ích độc lập
│       ├── comboHelper.ts     # Tính toán phát hiện liên chiêu kích hoạt thuộc tính.
│       ├── companionHelper.ts # Khởi tạo chỉ số của hộ vệ đồng hành theo Sư Môn.
│       ├── economy.ts         # Tính toán hệ số lạm phát giá vàng theo độ khó ải.
│       ├── quest.ts           # Hệ thống sinh ngẫu nhiên nhiệm vụ giang hồ và bí kíp môn phái.
│       └── storage.ts         # Đắp nối lưu trữ - tải lượt chơi cục bộ qua LocalStorage.
```

---

## 4. Kiến Thức Nền — Võ Lâm Hùng Bá

### 4.1 Thập Đại Môn Phái (10 Sects)

Hệ thống môn phái chia đều các chỉ số chiến lược ban đầu:

1. **Thiếu Lâm (sl):** Thiên về Ngoại Công (Con) dồi dào, sinh lực cao nhất. Hộ Vệ: *Đạt Ma Tăng*.
2. **Võ Đang (vd):** Cân bằng hoàn hảo giữa Thân Pháp (Agi) và Nội Công (Nei). Hộ Vệ: *Chân Vũ Đài Sĩ*.
3. **Nga Mi (nm):** Buff hỗ trợ, tăng trưởng mana hồi tốt. Hộ Vệ: *Tịnh Nhàn Ni Cô*.
4. **Cái Bang (cb):** Thân pháp cao, bạo kích mạnh. Hộ Vệ: *Hồng Thất Khất*.
5. **Đường Môn (tm):** Thợ đặt bẫy, ám khí tiễn thuật tầm xa. Hộ Vệ: *Tiêu Hồn Sát*.
6. **Côn Lân (cl):** Sấm sét, tốc đao xuất chiêu nhanh. Hộ Vệ: *Lôi Chấn Tử*.
7. **Ngũ Độc (nd):** Độc chú dòn dã rút máu quái theo thời gian. Hộ Vệ: *Cổ Thần Nhân*.
8. **Thúy Yên (ty):** Băng sương làm chậm, né tránh xuất chúng. Hộ Vệ: *Tuyết Ảnh Điệp*.
9. **Thiên Vương (tv):** Cận chiến siêu phòng thủ, kháng tính hoàn mỹ. Hộ Vệ: *Dũng Tướng Quân*.
10. **Thiên Nhẫn (tn):** Hỏa thiêu cường bạo, gia tăng sát thương chí mạng nổ diện rộng. Hộ Vệ: *Ma Giáo Thần Sử*.

### 4.2 Tu Luyện Bí Kíp (Sư Môn Bí Kíp)

Bên cạnh trang bị võ bửu, người môn hạ được trang bị khối hệ thống **Bí Kíp Môn Phái** dồi dào sức chiến đấu:
- Được trang bị tối đa **2 quyển** cùng lúc để cộng dồn hiệu ứng.
- **Nâng cấp bằng Vàng** lũy tiến nhân hệ số `1.8x`. Đạt cực đỉnh tại Cấp 5.
- Bao gồm các chỉ số gia cường thiết thực: Tăng sát thương phần trăm (`dmgMult`), cộng máu phẳng (`hpBonus`), rút ngắn thời gian hồi kĩ năng (`cdReduc`).

---

## 5. Hướng Dẫn Lập Trình & Quy Chuẩn Code

### 5.1 Quản Lý Trạng Thái (GameState Flow)

Tất cả trạng thái của một vòng chơi (Run-based) được đồng hóa qua định dạng JSON lưu trong LocalStorage. 
- **Auto-Save:** Thực hiện lưu tự động qua React `useEffect` mỗi khi `gameState` biến chuyển tích cực.
- **Khôi Phục:** Nút **"Tiếp Tục"** ở Menu chính sẽ tự phục hồi nhân vật, trang bị, bí kíp, tiến trình ải và đồng hành nguyên vẹn hệt như trước khi tắt trình duyệt.

```typescript
// Định nghĩa cấu trúc lưu thiết yếu (src/types.ts)
export interface GameState {
  state: 'SELECTING' | 'PLAYING' | 'CLEARED' | 'GAMEOVER';
  stage: number;
  gold: number;
  exp: number;
  player: {
    hp: number; maxHp: number;
    mp: number; maxMp: number;
    atk: number;
    level: number;
    equipment: { ... };
  };
  companion?: Companion;
  quests?: Quest[];
  manuals?: MartialManual[];
}
```

### 5.2 Custom 2D Canvas Renderer (GameCanvas.tsx)

Xử lý đồ họa trực diện thông qua hàm `loop(time)` dập nhịp liên tục nhờ `requestAnimationFrame`:
1. **Camera Hệ:** Di chuyển mượt mà bám sát tọa độ nhân vật chính. Tạo hiệu ứng rung lắc `shakeRef` mãn nhãn mỗi khi nhân vật trúng đòn nặng hoặc xuất chiêu Tuyệt học.
2. **Hệ Thống Hạt (Particle System) & Chữ Nổi:** Mỗi cú chém, vụ nổ lửa, hay tia sấm sét đều sản sinh các hạt màu sắc với thời gian sống độc lập (`life`), chuyển dịch gia tốc (`vx, vy`) dạt dào sinh khí.
3. ** Autonomous Companion (Đồng Hành Hòa Nhịp):** Đồng hành tự động tìm kẻ địch gần nhất trong bán kính 350px để quất đòn chí mạng hỗ trợ, vẽ vạch quỹ đạo đạn màu vàng cổ điển, bay chữ nổi báo sát thương rực rỡ.

---

## 6. Tham Số Cân Bằng Game (Stage Scaling)

Hệ thống tính toán kinh tế giang hồ nằm ở mục `src/utils/economy.ts` và `src/constants.ts`:
- **Độ khó quái:** HP và sát thương kẻ địch nhân gia hệ số tăng dần tương ứng với số ải (`stage`).
- **Merchant of River Styx (Giá cả thương nhân):** Vượt qua ải 10, giá mua Mạng hồi sinh (`Heart`) và Tầm Bảo Thiết Bản vẽ vũ khí (`Gacha Weapon`) tăng lũy kế để kiểm soát lạm phát vàng trong một lượt chạy kéo dài.

---

## 7. Giải Pháp Sinh Ngẫu Nhiên Kỳ Ngộ Giang Hồ

Tính năng "Kỳ Ngộ" lúc dọn xong ải mang đến những phần thưởng/hình phạt đa dạng:

```
Vượt Ải Thành Công
  └── Fired POST request to /api/encounter (Server-side)
        ├── if GEMINI OK  => Nhận 3 câu truyện ngẫu diệu do AI phác họa theo phái hiện thời.
        └── if GEMINI 429 => Kích hoạt bộ sinh Kỳ Ngộ dồi dào sắc thái bản môn (Thiếu Lâm, Võ Đang, Cái Bang,...) cục bộ nhanh chóng (20ms), không gián đoạn trò chơi.
```

---

## 8. Sửa Lỗi Quota Limit 429 — Chữa Trị Triệt Để

Giới hạn Free Tier của Gemini API chỉ cho phép gọi **20 lượt bứt phá mỗi ngày hoặc tốc độ giới hạn mỗi phút**. Để loại bỏ hoàn toàn các chấm lỗi đỏ hỏng trò chơi, chúng ta áp dụng mô hình **Double Safe-Guard**:

1. **Phòng tránh lỗi tại Máy Chủ (`server.ts`):**
   - Đóng gói toàn bộ lệnh gọi Gemini trong khối `try-catch`.
   - Bổ sung hàm `getLocalEncounters` chứa sẵn kho tàng 11 tình huống Kỳ Ngộ giang hồ dập khuôn chuẩn kiếm hiệp (đầy đủ phân loại Rarity, tự động nhân hệ số tỉ lệ vàng/hp dồi dào theo chỉ số ải hiện tại).
   - Đặt thời gian chờ tối thiểu `Promise.race` là **4.5 giây**. Nếu API bị đóng băng quá lâu do mạng nghẽn, máy chủ tự hủy lệnh gọi và nạp ngay Kỳ Ngộ nội bộ.

2. **Cách phản hồi phía Client (`StageClearOverlay.tsx`):**
   - Nhận diện tệp trả về dưới dạng JSON thô. Khi có biến cố lỗi từ Server, API `/api/encounter` vẫn bình tĩnh phản hồi mã `200 OK` chứa dữ liệu 3 Kỳ Ngộ địa phương thay vì ném lỗi `500 Internal Server error`.
   - Trò chơi tiếp diễn cực kì mượt mà, người dùng hoàn toàn cảm nhận được chất li kì võ hiệp nguyên bản mà không hề hay biết API đang bị nghẽn mạng!

---

## 9. Sự Mất Hợp Lý Đã Phát Hiện & Đề Xuất Cải Tiến

### 1. Rò Rỉ Tài Nguyên Ảnh Nền
- **Vấn đề:** Các hàm lọc màu pixel nền tranh (`removeCharacterBackground`) chạy trực tiếp trên luồng chính của trình duyệt (Main Thread) mỗi khi nhân vật hoặc đồng hành xuất chiêu nạp ảnh mới. Điều này có thể gây giật khung hình nhẹ (Micro-stuttering) đối với các dòng máy điện thoại di động cấu hình yếu.
- **Đề xuất:** Thực hiện lưu trữ bộ nhớ đệm (Cache) các Canvas đã lọc nền thành công sau khi tải ảnh lần đầu ở màn hình chọn phái (`SectSelection`).

### 2. Sự Mất Cân Bằng Giữa Các Phái Tầm Xa
- **Vấn đề:** Đường Môn (tm) với Hộ vệ *Tiêu Hồn Sát* gây sát thương cực xa mà không cần áp sát, trong khi Thiếu Lâm (sl) hay Thiên Vương (tv) cận chiến chịu áp lực quái bu đông quá tải cực kì nặng.
- **Đề xuất:** Thêm chỉ số Giáp phản sát thương vật lý hoặc Hút máu phần trăm cho riêng các võ phái trường phái Cận chiến để đảm bảo tính bình đẳng võ hiệp phong phú.

---

## 10. Checklist Trước Khi Xác Nhận Thay Đổi (Commit)

```markdown
- [x] Chạy `npm run lint` bảo đảm typescript gõ chữ sạch bóng không ném lỗi TS compilation.
- [x] Chạy `npm run build` để kiểm tra Vite tổng hợp mã nguồn thành dạng tĩnh không vướng mắc.
- [x] Check file `.env.example` xem đã khai báo các hằng số biến môi trường chuẩn chỉnh (không nạp keys thật).
- [x] Bảo toàn cơ chế Fallback địa phương an tâm cho trải nghiệm không gián đoạn.
```

---

*Tài liệu này là tài sản chung của đội ngũ phát triển Võ Lâm Roguelite, cập nhật liên tục để nâng tầm võ học nước nhà.*
