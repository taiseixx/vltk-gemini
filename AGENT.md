# AGENT.md — VLTK Roguelite Game Development Guide

> **Đây là file hướng dẫn hành động bắt buộc dành cho mọi Coding Agent khi làm việc với dự án Võ Lâm Roguelite.**
> Đọc TOÀN BỘ file này TRƯỚC KHI thực hiện bất kỳ thay đổi nào trong mã nguồn. 
> Luôn luôn cập nhật hướng dẫn này mỗi khi tích hợp tính năng lớn hoặc thay đổi quy chuẩn hệ thống.

---

## 0. TL;DR — Đặc Tả Cực Nhanh

```yaml
Stack   : React 18 + Vite + Custom HTML5 2D Canvas Engine
Theme   : Võ Lâm Truyền Kỳ (Vuxia) — Đầy đủ Thập Đại Phái chính tông
Genre   : Roguelite Auto-combat Survivor — Vượt ải dọn quái, chiêu hộ Đồng Hành, săn Trang Bị, tu luyện Bí Kíp.
AI      : Google Gemini API Server-proxy (`/api/encounter`) — Tự động sinh cuộc Kỳ Ngộ ngẫu nhiên.
Linter  : ESLint (`npm run lint` / `tsc --noEmit` check loại bỏ type-error trước khi build)
RNG     : Seeded/Simple RNG với State Auto-save & Load tức thời qua LocalStorage
```

---

## 1. Bản Đồ Giao Thức Dữ Liệu (Game State Data Specifications)

Để tránh biên dịch lỗi hoặc tự suy diễn thuộc tính không tồn tại, dưới đây là toàn bộ cấu trúc định kiểu cực kỳ chi tiết trong `src/types.ts` không cắt ngắn:

```typescript
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'emerald' | 'gold_rarity' | 'crimson' | 'pink';

export type HeritagePrefix = 'thất truyền' | 'gia truyền' | 'tông truyền' | 'ân điển';

export interface Sect {
  id: string;
  name: string;
  icon: string;
  color: string;
  motto: string;
  stats: {
    str: number; // Sức mạnh (Ảnh hưởng Sát thương - ATK)
    agi: number; // Thân pháp (Tốc độ, Né tránh)
    con: number; // Ngoại công (Máu cực đại - Max HP)
    int: number; // Nội công (Nội lực cực đại - Max MP)
    nei: number; // Linh lực (Hồi phục chân khí)
  };
  skills: string[];
}

export interface Skill {
  name: string;
  level: number;
  maxLevel: number;
  cooldown: number;
  cooldownLeft: number;
  manaCost: number;
  baseDamage: number;
  range: number;
  color: string;
}

export type EquipmentType = 'weapon' | 'armor' | 'accessory' | 'special' | 'horse' | 'cloak' | 'seal' | 'banner';

export interface Equipment {
  type: EquipmentType;
  rarity: Rarity;
  power: number;
  name: string;
  tier?: number;
  upgradeLvl?: number;
  heritage?: HeritagePrefix;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'escort' | 'jailbreak' | 'sect' | 'songjin';
  difficulty: 'Trầm Tích' | 'Giang Hồ' | 'Tông Môn' | 'Hoàng Kim';
  banner: string;
  targetCount: number;
  currentCount: number;
  status: 'available' | 'active' | 'completed' | 'claimed';
  rewardLabel: string;
  rewardValue: {
    gold: number;
    exp: number;
    equipRarity: Rarity;
    equipPrefix: HeritagePrefix;
  };
}

export interface MartialManual {
  id: string;
  name: string;
  sectId: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  effectName: string;
  statBoost: {
    atkChance?: number; // Tỉ lệ Chí Mạng cộng thêm (ví dụ: 0.04)
    atkSpeed?: number;  // Tốc độ đánh / Giảm thời gian hồi ám khí (ví dụ: 0.08)
    goldMult?: number;  // Hệ số vàng nhận thêm (ví dụ: 0.15)
    resBonus?: number;  // Kháng tính phòng thủ (ví dụ: 0.10)
    hpBonus?: number;   // Máu phẳng dồi dào (ví dụ: 50)
    mpBonus?: number;   // Chân khí nội tạng (ví dụ: 30)
    dmgMult?: number;   // Lực phách công chưởng (ví dụ: 0.10)
    cdReduc?: number;   // Thấu lăng giảm hồi chiêu thức (ví dụ: 0.08)
  };
  icon: string;
  equipped: boolean;
  level: number;
  maxLevel: number;
  levelRequirement: number;
}

export interface Companion {
  name: string;
  type: string;
  emoji: string;
  level: number;
  exp: number;
  hp: number;
  maxHp: number;
  atk: number;
  unlocked: boolean;
  equipment: {
    weapon: Equipment | null;
    armor: Equipment | null;
  };
}

export interface Entity {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  atk: number;
  speed: number;
  size: number;
  atkCd: number;
  color: string;
  isBoss: boolean;
  name?: string;
  isSubBoss?: boolean;
  element?: 'Metal' | 'Wood' | 'Water' | 'Fire' | 'Earth';
}

export interface GameState {
  state: 'SELECTING' | 'PLAYING' | 'CLEARED' | 'GAMEOVER';
  stage: number;
  lives: number;
  livesBought: number;
  gold: number;
  exp: number;
  mobsTotal: number;
  mobsKilled: number;
  bossSpawned: boolean;
  stagePhase: 'CREEPS' | 'SUB_BOSSES' | 'FINAL_BOSS';
  auto: boolean;
  player: {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    radius: number;
    speed: number;
    facing: number;
    level: number;
    statPoints: number;
    skillPoints: number;
    baseStats: Sect['stats'];
    currentStats: Sect['stats'];
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    atk: number;
    rage: number;
    maxRage: number;
    rageActive?: boolean;
    rageTimer?: number;
    target: Entity | null;
    moving: boolean;
    atkCd: number;
    dead: boolean;
    color: string;
    icon: string;
    sectId?: string;
    skillComboHistory?: number[]; 
    comboTimer?: number;
    activeCombo?: { name: string; multiplier: number; timer: number; color: string } | null;
    equipment: {
      weapon: Equipment | null;
      armor: Equipment | null;
      accessory: Equipment | null;
      special: Equipment | null;
      horse: Equipment | null;
      cloak: Equipment | null;
      seal: Equipment | null;
      banner: Equipment | null;
    };
  };
  buffs: {
    dmgMult: number;
    hpMult: number;
    cdReduc: number;
    resMult: number;
    rlGold: number;
    rlExp: number;
    rlExec: number;
    critDmgMult?: number;
    skillRangeBonus?: number;
  };
  skills: Skill[];
  entities: Entity[];
  drops: Drop[];
  livesPurchased: number;
  companion?: Companion;
  quests?: Quest[];
  manuals?: MartialManual[];
}
```

---

## 2. Quy Chuẩn Viết Code & Thiết Kế Kiến Trúc (Code Conventions)

Để duy trì chất lượng mã nguồn phát triển lâu dài không drift:

### 2.1 Đặt Tên Biến & Kiểu Khai Báo (Naming Conventions)
- **Tên Component / Type / Enum:** Luôn dùng `PascalCase` (vd: `GameCanvas`, `QuestTracker`, `MartialManual`).
- **Tên Biến / Thuộc Tính / Hàm:** Luôn luôn dùng `camelCase` (vd: `setGameState`, `currentCount`, `removeCharacterBackground`).
- **Tên Thư Mục / Ảnh Tĩnh:** Dùng `snake_case` hoặc viết thường cách nét ngang (vd: `assets/images/wuxia_escort.png`).
- Đặt định kiểu tường minh, nghiêm cấm lạm dụng kiểu dạng thô `any` trong các hàm xử lý cốt lõi.

### 2.2 Quy Hoạch Vòng Lặp Canvas Hiệu Năng Cao (`GameCanvas.tsx`)
- **Tách Biệt Sát Thương & Đồ Họa:** Logic di chuyển quái nhập tọa độ (`x, y`), tính toán va chạm vật lý **phải** được cập nhật một cách độc lập với chức năng vẽ (drawing functions).
- **Vẽ Mượt Tránh Trì Trệ (Stateless Rendering):** Tuyệt đối không thực hiện đọc thuộc tính DOM lớn hoặc cập nhật State React cục bộ bên trong vòng lặp hoạt họa `requestAnimationFrame` (`loop` function). Chỉ sử dụng biến tham chiếu React `useRef` hoặc thay đổi trực tiếp đồ họa lớp Canvas.
- **Micro-Stuttering Avoidance:** Không gọi thiết lập nạp hình ảnh `new Image()` hoặc dán pixel làm mịn trong hàm vẽ từng khung hình. Tất cả tài nguyên ảnh phải được tải sẵn và khử biên trong các mảng cached refs (`playerSectSpritesRef.current`).

```typescript
// ✅ ĐÚNG: Thay đổi trực tiếp hoạ đồ hạt rực rỡ qua update loop mà không cập nhật State React liên tục
particlesRef.current.forEach(p => {
  p.x += p.vx;
  p.y += p.vy;
  p.life--;
});

// ❌ SAI: Set state React liên tiếp mỗi mili-giây hoặc mỗi frame của Animation Loop
setParticles(prev => prev.map(p => ({ ...p, x: p.x + p.vx }))); // KHÔNG! Sẽ làm tắc nghẽn giao diện và tụt FPS nghiêm trọng.
```

---

## 3. Bản Hướng Dẫn Hành Động Thêm Mới Tính Năng (Actionable Guides)

Khi được yêu cầu mở rộng trò chơi, hãy tuân thủ chính xác từng bước một:

### 3.1 Quy Trình Thêm Một Môn Phái Mới (New Sect)
Để thêm một môn phái mới (ví dụ: phái Hoa Sơn - `hs`), làm đúng 3 bước:
1. **Bước 1 (Định nghĩa hạt nhân):** Vào `src/constants.ts`, khai báo thêm môn phái vào cuối danh sách mẫu `SECTS`:
   ```typescript
   {
     id: 'hs',
     name: 'Hoa Sơn',
     icon: '🗡️',
     color: '#1abc9c',
     motto: 'Kiếm xuất vô hình, Hành vân lưu thủy',
     stats: { str: 3, agi: 3, con: 1, int: 2, nei: 1 },
     skills: ['Hỗn Nguyên Chưởng', 'Quán Sa Kiếm', 'Thập Bát Đao Pháp', 'Độc Cô Cửu Kiếm Bản Phong']
   }
   ```
2. **Bước 2 (Thiết lập Bí Kíp đồng bộ):** Tìm đến `SECT_LEVEL_MANUALS` trong `src/utils/quest.ts`, thêm danh mục bí bửu 3 cấp độ (Rare, Epic, Legendary):
   ```typescript
   hs: [
     { name: 'Trung Cấp Tử Hà Thần Công', rarity: 'rare', effect: 'Lực nổ: +8% Lực phách sát lực', statBoost: { dmgMult: 0.08 } },
     { name: 'Cao Cấp Kiếm Ý Thông Minh', rarity: 'epic', effect: 'Thần nhịp CD: Giảm 10% CD xuất chiêu', statBoost: { cdReduc: 0.10 } },
     { name: 'Tuyệt Thế Độc Cô Kiếm Quyết', rarity: 'legendary', effect: 'Phong Vân: +40 HP cực hạn và +6% Chí Mạng', statBoost: { hpBonus: 40, atkChance: 0.06 } }
   ]
   ```
3. **Bước 3 (Thêm Hộ Vệ Sư Môn):** Vào `src/utils/companionHelper.ts`, thêm tương ứng Hộ vệ Hoa Sơn cứu giá đắc lực (Ví dụ: `Kiếm Khách Hoa Sơn`).

---

### 3.2 Quy Trình Thêm Một Kỹ Năng Mới (New Skill / Combo)
Muốn thêm chiêu thức mới kích hoạt trong chiến trận:
1. **Bước 1:** Cập nhật tệp `src/constants.ts` trong dải chiêu của phái sở tại.
2. **Bước 2:** Vào `src/components/GameCanvas.tsx`, bổ sung logic thi triển đồ họa cho chiêu thức đó bên trong hàm `castPlayerSkill` hoặc quy cách vẽ hạt chiêu tức:
   ```typescript
   if (skillName === "Độc Cô Cửu Kiếm Bản Phong") {
     // Tạo loạt hạt kiếm bay vòng tròn
     for (let i = 0; i < 8; i++) {
       const angle = (i * Math.PI) / 4;
       particlesRef.current.push({
         x: player.x,
         y: player.y,
         vx: Math.cos(angle) * 7,
         vy: Math.sin(angle) * 7,
         life: 25,
         color: "#1abc9c",
         size: 4,
         type: 'sword'
       });
     }
   }
   ```

---

### 3.3 Quy Trình Thêm Một Tình Huống Nhiệm Vụ Giang Hồ (New Quest)
Khi bổ sung một thể loại nhiệm vụ mới:
1. **Bước 1:** Khai báo kiểu Loại vào `Quest['type']` trong `src/types.ts`.
2. **Bước 2:** Điền logic sinh tên gọi, mô tả, ảnh bìa, chỉ tiêu đếm quái (`targetCount`) và phần thưởng vào hàm `generateRandomQuest` trong `src/utils/quest.ts`.
3. **Bước 3:** Bổ sung cơ chế cộng điểm tích lũy (`currentCount`) vào hàm kết liễu quái hoặc vượt ải tại `src/components/GameCanvas.tsx`:
   ```typescript
   setGameState(prev => {
     const updatedQuests = prev.quests?.map(q => {
       if (q.status === 'active' && q.type === 'new_type') {
         const newCount = Math.min(q.targetCount, q.currentCount + 1);
         return {
           ...q,
           currentCount: newCount,
           status: newCount >= q.targetCount ? 'completed' : 'active'
         };
       }
       return q;
     });
     return { ...prev, quests: updatedQuests };
   });
   ```

---

## 4. Hệ Thống Nhiệm Vụ & Đồng Hành (Specs & Lifecycle)

### 4.1 Vòng Đời Nhiệm Vụ (Quest Lifecycle Flow)

Vòng đời của cuộc hành tẩu Giang hồ diễn ra mạch lạc qua 4 nấc thang trạng thái:
1. **available (Hiện Diện):** Xuất hiện khi người chơi mở hòm kỳ ngộ hoặc sau ải dọn phòng. Người chơi chọn "Nhận Nhiệm Vụ".
2. **active (Chấp Hành):** Nhiệm vụ được theo dõi rà soát trong `QuestTracker`. Mỗi lần quái ngục trần ai hay Thủ Lĩnh ngã ngũ sẽ tăng biến `currentCount`.
3. **completed (Hoàn Thành):** Khi `currentCount >= targetCount`, vạch chữ nổi báo rực rỡ "Nhiệm vụ hoàn thành", trạng thái chuyển thành `completed`.
4. **claimed (Lãnh Thưởng):** Người chơi click "Nhận Quà" ở giao diên, nhận EXP, Vàng dạt dào và trang bị theo phẩm hệ, sau đó nhiệm vụ biến mất khỏi vách theo dõi.

### 4.2 Thiết Đặc Tả Chỉ Số Companion (Đồng Hành Sư Môn)
Companion bám vai người chiến sĩ di tản và đánh địch thông qua cơ chế tự động tìm mục tiêu (`target`):
- **Cơ chế EXP:** Đồng Hành nhận `1` exp mỗi khi người chơi diệt quái. Đủ EXP thăng cấp tăng trực tiếp HP và sức tấn công `atk` dũng mãnh.
- **Bộ trang bị đồng hành (`equipment`):** Được cường hóa giáp trụ (`armor`) hoặc đao kiếm (`weapon`) để cộng phần trăm sát thương rạch ròi.

---

## 5. Trọng Tâm Cân Bằng Game & Kinh Tế (Centralized Balance)

Tránh tuyệt đối việc tự ý gài số ảo (Magic Numbers) trong toán thức. Mọi chỉ số phải theo sát quy luật:

| Đối Tượng Đặc Tả | Hệ Số Tăng Trưởng Hoạt Động | Vị Trí Lưu Trữ / File |
| :--- | :--- | :--- |
| **Enemy HP Scale** | `HP = HP_base * (1 + stage * 0.15)` | `src/components/GameCanvas.tsx` |
| **Enemy Damage Scale** | `Damage = Damage_base * (1 + stage * 0.12)` | `src/components/GameCanvas.tsx` |
| **Giá Thập Vật phẩm** | `Price = Base_Price * (1 + Math.floor(stage / 10) * 0.25)` | `src/utils/economy.ts` -> `getStageAdjustedGold` |
| **Bí Kíp Phí (Manual Upgrade)** | `Cost = 600 * Math.pow(1.8, current_level - 1)` | `src/components/Sidebar.tsx` -> `handleUpgradeManual` |

---

## 6. Săn Lùng Lỗi & Giải Pháp Hành Động (Known Bugs - Actionable)

Dưới đây là các lỗi và thiếu sót hiệu năng đã xác định, kèm theo cách khắc phục cực kì chính xác cho các Agent trong tương lai:

### BUG-001: Rò rỉ hiệu năng lọc pixel nền dán ảnh nhân vật
- **Vấn đề:** Hàm lọc khử màu nền canvas `removeCharacterBackground()` của các file Sprite nhân vật chạy trực diện trong lúc render cảnh động. Điều này dẫn tới sụt giảm khung hình nghiêm trọng trên thiết bị cấu hình trung bình.
- **Mức độ khẩn thiết:** **Cao (High)**
- **Vỉ trí tệp tin:** `src/components/GameCanvas.tsx`
- **Cách khắc phục chính thức:** Triển khai một bộ nhớ đệm `Map<string, CanvasImageSource>` để lưu trữ kết quả đầu ra của canvas đã lọc nền thay vì thực thi bóc tách pixel `getImageData` liên tục.
  ```typescript
  // ✅ Cách vá chuẩn xác:
  const backgroundFilterCache = new Map<string, CanvasImageSource>();
  export function getFilteredImage(img: HTMLImageElement, cacheKey: string): CanvasImageSource {
    if (backgroundFilterCache.has(cacheKey)) {
      return backgroundFilterCache.get(cacheKey)!;
    }
    const filtered = removeCharacterBackground(img);
    backgroundFilterCache.set(cacheKey, filtered);
    return filtered;
  }
  ```

---

## 7. Tài Bản Mẫu Google Gemini Prompts & Mock Payload

Toàn bộ thông tin cuộc hội thoại truyền tin cho máy chủ và kết cấu phản hồi an toàn:

### 7.1 Nội dung Prompt Truyền Tải lên Server
```
Nhân vật người chơi đang sử dụng là môn phái: {sectId}
Cấp độ hiện tại: {stage}, Máu hiện tại: {hp}/{maxHp}, Vàng: {gold}
Hãy sinh ra 3 tình huống "Kỳ ngộ giang hồ" theo kiểu JSON tinh tế cấu trúc...
```

### 7.2 Định dạng Mock JSON Response chuẩn khi Gemini Gặp Lỗi
Khi API của Gemini trả về mã lỗi **429 (Resource Exhausted)** do vượt hạn mức ngày, server-side proxy ngay lập tức dạt về bộ ngắt mạch khẩn và gửi dữ liệu chuẩn chất Võ Lâm sau tới Client:

```json
[
  {
    "name": "Thần Tài Gõ Cửa",
    "rarity": "rare",
    "event_text": "Vô tình lượm được một túi gấm rách bên gốc đa chứa nhiều ngân lượng quý phái.",
    "stat_changes": { "hp": 0, "gold": 120 }
  },
  {
    "name": "Kẻ Gian Ám Toán",
    "rarity": "normal",
    "event_text": "Bị một nhóm thổ phỉ độc thủ phục kích trong trà quán quán bên góc đa.",
    "stat_changes": { "hp": -25, "gold": -15 }
  },
  {
    "name": "Môn Phái Đàn Kỳ",
    "rarity": "epic",
    "event_text": "Một bóng điểu đồng môn phái gửi mật tịnh đan bang trợ dũng khí dâng tràn.",
    "stat_changes": { "hp": 50, "gold": 30 }
  }
]
```

---

## 8. Chiến Thuật Kiểm Thử & Gỡ Lỗi (Testing & Debug Strategy)

Vì ứng dụng chạy trực tiếp trên luồng Full-stack không sử dụng Framework kiểm thử ngoài cồng kềnh, quyến rũ thực hiện debug an toàn bằng các phương án:

1. **Trạng thái mô phỏng (Sandbox Debug Panel):** 
   - Đính kèm trực tiếp trạng thái GameState vào biến toàn cục trình duyệt: `(window as any).gameState = gameState`.
   - Giúp Agent mở console và can thiệp chỉ số tức thì để test (VD: tăng vàng thêm sắm đồ bằng dòng lệnh: `window.gameState.gold = 99999`).
2. **Kiểm thử Canvas Render Loop:**
   - Khi phát hiện quái vật biến mất hoặc lỗi tọa độ không vẽ được, kiểm tra điều kiện vẽ trong `draw()` có bị gãy do giá trị `NaN` hoặc `undefined` bằng cách đặt lồng kiểm tra giá trị cận vệ:
     ```typescript
     if (isNaN(entity.x) || isNaN(entity.y)) {
       console.error("Entity position is NaN:", entity);
       return;
     }
     ```
3. **Mô phỏng API Kỳ Ngộ ngoại tuyến:**
   - Hãy tắt tạm mạng hoặc đổi khóa mộc env `GEMINI_API_KEY=""` để đảm bảo hệ thống chuyển hướng thông suốt về bộ đệm cứu nguy `getLocalEncounters` hoạt động 100% không phát sinh lỗi phá hỏng app.

---

## 9. Bảng Thuật Ngữ Bản Môn Trực Quan (Terminology Table)

Áp dụng đúng từ vựng Giang Hồ tương quan với thuộc tính kỹ thuật trong Code:

| Thuật ngữ Võ Lâm | Thuộc tính/Properties trong Code | Ý nghĩa Chiến Thuật |
| :--- | :--- | :--- |
| **Nội Công (Tu dưỡng)** | `int` / `nei` | Tương đương mana tối đa và chỉ số hồi mana tĩnh. |
| **Cực Cảnh Thần Phong** | `maxLevel` | Đạt ngưỡng cấp độ 5 cao nhất của Bí Kíp danh bất hư truyền. |
| **Kỳ Ngộ Giang Hồ** | `api/encounter` | Sự kiện bất ngờ của AI tăng giảm thuộc tính lập tức. |
| **Độ Khó Tông Môn** | `difficulty: 'Tông Môn'` | Cấp khó rương kho báu rơi vũ khí, x2 phần thưởng EXP. |
| **Đồng Hành Chiếu Cố** | `companion` | Hộ vệ đi theo phụ công sát thương lớn định hướng kẻ địch. |
| **Phong Vân Ân Điển** | `heritage: 'ân điển'` | Tiền tố hoàng kim bộc phá dòng thuộc tính trang bị ẩn. |

---

## 10. Checklist 15 Tiêu Điểm Sắt Đá Trước Khi Hoàn Thành Thay Đổi

```markdown
- [ ] 1. Tuyệt đối không khai báo bất kỳ form/modal nhập khóa API trực tiếp cho người dùng.
- [ ] 2. Tuyệt đối không để lộ file chứa API Key thật lên nhánh công khai của Git hay file ví dụ.
- [ ] 3. Đã chạy thử lệnh linter `npm run lint` kiểm tra kiểu dữ liệu sạch bóng không warning dở dang.
- [ ] 4. Đã lập hàm bổ sung dự phòng Kỳ Ngộ ngẫu nhiên `getLocalEncounters` tương đương cho mọi phái mới thêm.
- [ ] 5. Mọi hình ảnh sử dụng thẻ JSX `<img>` đều có thuộc tính bảo an `referrerPolicy="no-referrer"`.
- [ ] 6. Không có câu lệnh Mutate biến `GameState` trực hệ vô kỷ luật ngoài cơ chế an toàn `setGameState`.
- [ ] 7. Không có vòng lặp cập nhật State vô hạn (`infinite re-renders`) bên trong React `useEffect`.
- [ ] 8. Đã chạy thử nghiệm build thành công thông suốt cổng 3000 bằng lệnh `npm run build`.
- [ ] 9. Khôi phục hoàn chỉnh trạng thái nhân vật tự động thông suốt từ bộ nhớ lưu trữ `localStorage`.
- [ ] 10. Khoảng cách vẽ các nét chữ nổi không bị dính đè lên các đối tượng game khác.
- [ ] 11. Các đối tượng Đồng hành tự động triệt tiêu đạn bay ra ngoài biên bản đồ đấu tranh tránh rò rỉ dung lượng.
- [ ] 12. Không sử dụng thư viện mô phỏng mập mờ, giả lập tài nguyên không có thực trong package.
- [ ] 13. Sử dụng đúng font chữ mặc định chuẩn chỉnh của hệ thống để đồng dạng giao diện.
- [ ] 14. Bộ ngắt mạch Circuit Breaker khóa kết nối API hỏng hóc hoạt động mượt mà dưới 25ms.
- [ ] 15. Cố định toàn vẹn các thông số cân bằng Giang hồ vào tệp constants tương ứng thấu suốt.
```

---

*File này được bảo toàn và tuân thủ vô điều kiện tuyệt đối bởi thế hệ điều phối trò chơi Võ Lâm Roguelite.*
*Cập nhật lần cuối: May 24, 2026 bởi Code-Crafting AI.*
