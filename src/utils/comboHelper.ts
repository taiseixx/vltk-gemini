import { GameState, Particle, FloatingText } from "../types";

export interface ComboResult {
  name: string;
  multiplier: number;
  color: string;
  desc: string;
}

const SECT_COMBO_NAMES: Record<string, Record<string, string>> = {
  sl: {
    "0,1,2": "La Hán Tụ Lực Phục Ma Trận",
    "1,3,5": "Như Lai Thần Chưởng Kỳ Thế",
    "2,4,5": "Dịch Cân Kinh Kim Cang Phục Ma"
  },
  vd: {
    "0,1,2": "Lưỡng Nghi Phục Ma Thái Cực Kiếm",
    "1,3,5": "Chân Vũ Thần Công Kiếm Khí Vô Song",
    "2,4,5": "Tam Thanh Kiếm Khí Thái Cực Vô Lượng"
  },
  cb: {
    "0,1,2": "Đả Cẩu Thiên Hạ Vô Cẩu Bổng",
    "1,3,5": "Kháng Long Phi Long Thần Biến",
    "2,4,5": "Hàng Long Thập Bát Liên Hoàn Chưởng"
  },
  nm: {
    "0,1,2": "Phiêu Tuyết Xuyên Vân Ngọc Nữ Kiếm",
    "1,3,5": "Thanh Tâm Chú Phật Quang Phổ Chiếu",
    "2,4,5": "Cửu Âm Bạch Cốt Thiên Địa Quyết"
  },
  cl: {
    "0,1,2": "Phong Sương Phi Yến Kiếm Trận",
    "1,3,5": "Thiên Lôi Chấn Vũ Khiếu Thiên Lôi",
    "2,4,5": "Lôi Động Cửu Thiên Khiếu Long Trảm"
  },
  nd: {
    "0,1,2": "Vạn Độc Xuyên Tâm Tiễn",
    "1,3,5": "Bách Độc Xuyên Linh Vạn Cổ Hồn",
    "2,4,5": "Ngũ Độc Thần Sa Thiên Châu Trận"
  },
  tm: {
    "0,1,2": "Phù Vân Bạo Vũ Lê Hoa Trâm",
    "1,3,5": "Cửu Cung Phi Tinh Ám Khí Hạt Độc",
    "2,4,5": "Thiên Địa Vô Ảnh Thần Tiễn Khí"
  },
  ty: {
    "0,1,2": "Tuyết Ảnh Lăng Ba Kiếm Pháp",
    "1,3,5": "Băng Tâm Tuyệt Diệu Thủ Thần Trận",
    "2,4,5": "Băng Sương Tỏa Ngọc Chấn Tuyết Trảm"
  },
  tv: {
    "0,1,2": "Thiên Vương Tọa Giáp Phá Giáp Kích",
    "1,3,5": "Hoành Tảo Thiên Quân Thương Quyết",
    "2,4,5": "Vạn Chúng Nhất Tâm Bá Vương Thương"
  },
  tn: {
    "0,1,2": "Hỏa Diệm Giải Thể Ma Công",
    "1,3,5": "Ma Diệm Phần Thiên Cửu Phong Hỏa",
    "2,4,5": "Thiên Ma Loạn Thần Diệt Thế Chưởng"
  }
};

export function checkAndTriggerCombo(
  idx: number,
  p: GameState["player"],
  tx: number,
  ty: number,
  actualRange: number,
  particles: Particle[],
  floatingTexts: FloatingText[],
  shakeRef: { current: number }
): ComboResult | null {
  // Initialize parameters
  if (!p.skillComboHistory) p.skillComboHistory = [];
  
  p.skillComboHistory.push(idx);
  if (p.skillComboHistory.length > 5) {
    p.skillComboHistory.shift();
  }
  
  // Give players 5 seconds of grace to cast the next skill
  p.comboTimer = 5.0;

  const last3 = p.skillComboHistory.slice(-3);
  const matchStr = last3.join(",");

  let comboInfo: ComboResult | null = null;
  const sectId = p.sectId || "sl";
  const namesForSect = SECT_COMBO_NAMES[sectId] || SECT_COMBO_NAMES.sl;

  // Combo 1: Dragon Spirit Blast (0,1,2 or 0,2,4)
  if (matchStr === "0,1,2" || matchStr === "0,2,4") {
    const defaultName = "🐉 LONG HỒN ĐẠI BỘC PHÁ!";
    const dispName = namesForSect[matchStr] ? `🐉 ${namesForSect[matchStr]}` : defaultName;
    comboInfo = {
      name: `${dispName} (x3.5 Sát Thương)`,
      multiplier: 3.5,
      color: "#f1c40f",
      desc: "Thương thiên long hồn rốing dậy thần uy, bộc phá càn quét vạn binh lính!"
    };
  }
  // Combo 2: Purple Frost / Lotus Shield (1,3,5 or 2,3,5 or 1,2,3)
  else if (matchStr === "1,3,5" || matchStr === "2,3,5" || matchStr === "1,2,3") {
    const defaultName = "❄️ TỬ ĐIỆP BĂNG PHONG!";
    const key = namesForSect[matchStr] ? matchStr : "1,3,5";
    const dispName = namesForSect[key] ? `❄️ ${namesForSect[key]}` : defaultName;
    comboInfo = {
      name: `${dispName} (x5.2 Sát Thương)`,
      multiplier: 5.2,
      color: "#9b59b6",
      desc: "Huyền băng diệu thủ bọc ngưng vân tuyết, sương phong tử mang diệt hồn xích độc!"
    };
    // Heal player for 10% of missing HP as a neat utility
    p.hp = Math.min(p.maxHp, p.hp + (p.maxHp - p.hp) * 0.15 + 30);
  }
  // Combo 3: Ultimate Celestial Sword (2,4,5 or 3,4,5)
  else if (matchStr === "2,4,5" || matchStr === "3,4,5") {
    const defaultName = "⚔️ VẠN KIẾM QUY TÔNG!";
    const key = namesForSect[matchStr] ? matchStr : "2,4,5";
    const dispName = namesForSect[key] ? `⚔️ ${namesForSect[key]}` : defaultName;
    comboInfo = {
      name: `${dispName} (x7.2 Sát Thương)`,
      multiplier: 7.2,
      color: "#e74c3c",
      desc: "Đỉnh cấp võ học kiếm khí ngút trời bộc phát, nhất kiếm phân phân thanh trừng sa trường!"
    };
  }

  if (comboInfo) {
    p.activeCombo = {
      name: comboInfo.name,
      multiplier: comboInfo.multiplier,
      timer: 3.5,
      color: comboInfo.color
    };

    // Intense screen shake
    shakeRef.current = Math.min(60, shakeRef.current + 35);

    // Reset history to enable immediate restarting of combos
    p.skillComboHistory = [];
    p.comboTimer = 0;

    // Colossal ring blast
    particles.push({
      x: tx,
      y: ty,
      vx: 0,
      vy: 0,
      life: 1.8,
      maxLife: 1.8,
      color: comboInfo.color,
      size: actualRange * 2.5,
      type: "ring"
    });

    particles.push({
      x: tx,
      y: ty,
      vx: 0,
      vy: 0,
      life: 0.9,
      maxLife: 0.9,
      color: "#ffffff",
      size: 24,
      type: "shockwave"
    });

    // Generate lightning bursts around the zone
    for (let j = 0; j < 8; j++) {
      const lx = tx + (Math.random() - 0.5) * actualRange * 1.5;
      const ly = ty + (Math.random() - 0.5) * actualRange * 1.5;
      particles.push({
        x: lx,
        y: ly,
        vx: 0,
        vy: 0,
        life: 0.4,
        maxLife: 0.4,
        color: comboInfo.color,
        size: 15,
        type: "lightning"
      });
    }

    // Dynamic beams radiating outwards
    for (let rot = 0; rot < Math.PI * 2; rot += Math.PI / 4) {
      particles.push({
        x: tx,
        y: ty,
        vx: Math.cos(rot) * 60,
        vy: Math.sin(rot) * 60,
        life: 1.0,
        maxLife: 1.0,
        color: comboInfo.color,
        size: 30,
        type: "beam",
        rotation: rot
      });
    }

    // Intense particle stream
    const isUltimateCombo = comboInfo.multiplier > 5.0;
    const count = isUltimateCombo ? 140 : 85;
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = 200 + Math.random() * (isUltimateCombo ? 650 : 400);
      particles.push({
        x: tx,
        y: ty,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        life: 0.6 + Math.random() * 0.9,
        color: Math.random() > 0.45 ? comboInfo.color : "#ffffff",
        size: 3 + Math.random() * (isUltimateCombo ? 10 : 5),
        type: "trail"
      });
    }

    // Drop towering visual pillars on the screen
    const pillarCount = isUltimateCombo ? 8 : 4;
    for (let i = 0; i < pillarCount; i++) {
      const lx = tx + (Math.random() - 0.5) * actualRange * 2.0;
      const ly = ty + (Math.random() - 0.5) * actualRange * 2.0;
      particles.push({
        x: lx,
        y: ly,
        vx: 0,
        vy: 0,
        life: 0.9 + Math.random() * 0.5,
        maxLife: 1.4,
        color: comboInfo.color,
        size: 45 + Math.random() * 40,
        type: "pillar"
      });
    }

    // Push big float announce text
    floatingTexts.push({
      id: Math.random(),
      x: tx,
      y: ty - 100,
      text: comboInfo.name,
      color: comboInfo.color,
      life: 3.2
    });
  }

  return comboInfo;
}
