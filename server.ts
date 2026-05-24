import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Pre-configured rich wuxia encounters for offline / rate-limit fallback
function getLocalEncounters(sectId: string, stage: number) {
  const sectNames: Record<string, string> = {
    'sl': 'Thiếu Lâm',
    'vd': 'Võ Đang',
    'nm': 'Nga Mi',
    'cb': 'Cái Bang',
    'cl': 'Côn Lân',
    'nd': 'Ngũ Độc',
    'tm': 'Đường Môn',
    'ty': 'Thúy Yên',
    'tv': 'Thiên Vương',
    'tn': 'Thiên Nhẫn'
  };
  const sName = sectNames[sectId.toLowerCase()] || sectId || 'Giang Hồ';

  // Base scaling stats with stage
  const hpBase = 40 + stage * 5;
  const goldBase = 50 + stage * 10;

  const allEncounters = [
    {
      name: "Thiêu Đơn Luyện Hoàn",
      rarity: "normal",
      event_text: "Gặp một đạo sĩ nhem nhuốc đang bán Tụ Khí Hoàn đan dồi dào sinh lực.",
      stat_changes: { hp: Math.floor(hpBase), gold: -Math.floor(goldBase * 0.5) }
    },
    {
      name: "Kẻ Gian Ám Toán",
      rarity: "normal",
      event_text: "Bị một nhóm thổ phỉ độc thủ phục kích trong trà quán quán bên góc đa.",
      stat_changes: { hp: -Math.floor(hpBase * 0.6), gold: -Math.floor(goldBase * 0.4) }
    },
    {
      name: "Thần Tài Gõ Cửa",
      rarity: "rare",
      event_text: "Vô tình lượm được một túi gấm rách bên gốc đa chứa nhiều ngân lượng quý phái.",
      stat_changes: { hp: 0, gold: Math.floor(goldBase * 2.5) }
    },
    {
      name: "Vong Hồn Tráng Sĩ",
      rarity: "rare",
      event_text: "Linh hồn chân truyền võ sĩ chỉ điểm yếu huyệt khí giúp tăng huyết thế dồi dào.",
      stat_changes: { hp: Math.floor(hpBase * 2.2), gold: 0 }
    },
    {
      name: "Duyên Khởi Trà Quán",
      rarity: "normal",
      event_text: "Nghỉ mát bên dốc đèo u tịch, sảng khoái uống chén trà gừng hồi phục sinh mệnh.",
      stat_changes: { hp: Math.floor(hpBase * 1.2), gold: -Math.floor(goldBase * 0.2) }
    },
    {
      name: sName === 'Thiếu Lâm' ? "Phật Quang Diệu Pháp" : "Mật Truyền Tâm Pháp",
      rarity: "epic",
      event_text: `Biến thiên cơ ngẫu chiêm thư phái ${sName} rơi bên mật động điều sinh tức đan hoàn mĩ.`,
      stat_changes: { hp: Math.floor(hpBase * 2.5), gold: Math.floor(goldBase * 1.5) }
    },
    {
      name: "Thương Nhân Vạn Bảo",
      rarity: "rare",
      event_text: "Gặp một thương khách lữ hành đổi ngân lượng lấy dược sâm quý hóa giải thương lực.",
      stat_changes: { hp: Math.floor(hpBase * 2.0), gold: -Math.floor(goldBase * 1.2) }
    },
    {
      name: "Phế Di Tích Cổ",
      rarity: "legendary",
      event_text: "Phát hiện thạch động lăng mộ chứa vàng ròng gia phả cổ của quý nhân thời cũ.",
      stat_changes: { hp: Math.floor(hpBase * 3.5), gold: Math.floor(goldBase * 4.0) }
    },
    {
      name: "Dịch Thủy Kỳ Tập",
      rarity: "epic",
      event_text: "Bắn tiêu đánh trả toán cướp ám vây thành công, thu gom chiến lợi ngân lượng dạt dào.",
      stat_changes: { hp: -Math.floor(hpBase * 1.2), gold: Math.floor(goldBase * 3.5) }
    },
    {
      name: "Bách Thảo Thần Bí",
      rarity: "normal",
      event_text: "Thử nếm vị quả hoang linh đỏ au ngọt hỷ bên khe suối dạt dào sinh năng lực lượng.",
      stat_changes: { hp: Math.floor(hpBase * 1.5), gold: 0 }
    },
    {
      name: "Môn Phái Đàn Kỳ",
      rarity: "epic",
      event_text: `Một bóng điểu đồng môn phái ${sName} gửi mật tịnh đan bang trợ dũng khí dâng tràn.`,
      stat_changes: { hp: Math.floor(hpBase * 2.0), gold: Math.floor(goldBase * 1.0) }
    }
  ];

  // Randomly shuffle index and select 3
  const shuffled = [...allEncounters].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Set up the API route for "Kỳ ngộ" (Random Encounters)
  app.post("/api/encounter", async (req, res) => {
    const { gameState } = req.body;
    const sectId = gameState?.player?.sectId || 'Vô Danh';
    const stage = gameState?.stage || 1;

    try {
      if (!process.env.GEMINI_API_KEY) {
        console.warn("[API/encounter] GEMINI_API_KEY lacks. Invoking local generator.");
        return res.json(getLocalEncounters(sectId, stage));
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        Bạn là một Dungeon Master cho một game Roguelite đề tài Võ Lâm rực rỡ mang tên "Võ Lâm Giang Hồ".
        Nhân vật người chơi đang sử dụng là môn phái: ${sectId}.
        Cấp độ hiện tại: ${stage}.
        Máu hiện tại: ${gameState?.player?.hp ?? 100}/${gameState?.player?.maxHp ?? 300}.
        Vàng: ${gameState?.gold ?? 0}.

        Sinh ra 3 tình huống "Kỳ ngộ giang hồ" (Random encounter) ngẫu nhiên có ảnh hưởng tới nhân vật. 
        Mỗi kỳ ngộ phải có độ hiếm khác nhau (Normal, Rare, Epic, Legendary), nội dung rất ngắn gọn gọn gàng để vừa màn hình mobile.
        Hãy trả lời bằng định dạng JSON nghiêm ngặt tuân thủ cấu trúc sau (trả về 1 mảng gồm 3 object).
        
        [
          {
            "name": "Tên Kỳ Ngộ (Ngắn, ấn tượng)",
            "rarity": "normal | rare | epic | legendary",
            "event_text": "Mô tả kỳ ngộ cực ngắn gọn (1 câu dài nhất).",
            "stat_changes": {
              "hp": <nguyên dương là hồi máu, âm là mất máu>,
              "gold": <dương là nhận vàng, âm là mất vàng>
            }
          }
        ]
      `;

      // Limit response waiting to 4.5 seconds to bypass gateway timeouts if free tier is busy
      const apiCall = ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const response = await Promise.race([
        apiCall,
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 4500))
      ]);
      
      if (response && response.text) {
        let jsonResponse = response.text;
        const parsed = JSON.parse(jsonResponse);
        if (Array.isArray(parsed) && parsed.length === 3) {
          return res.json(parsed);
        }
      }
      
      console.warn("[API/encounter] Invalid response empty; defaulting to fallback.");
      return res.json(getLocalEncounters(sectId, stage));

    } catch (error) {
      console.warn("[API/encounter] Gemini Rate limited 429 or API Exception. Seamless fallback initiated.");
      return res.json(getLocalEncounters(sectId, stage));
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
