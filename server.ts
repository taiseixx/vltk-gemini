import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Set up the API route for "Kỳ ngộ" (Random Encounters)
  app.post("/api/encounter", async (req, res) => {
    try {
      const { gameState } = req.body;
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        Bạn là một Dungeon Master cho một game Roguelite đề tài Võ Lâm rực rỡ mang tên "Võ Lâm Giang Hồ".
        Nhân vật người chơi đang sử dụng là môn phái: ${gameState.player.sectId}.
        Cấp độ hiện tại: ${gameState.stage}.
        Máu hiện tại: ${gameState.player.hp}/${gameState.player.maxHp}.
        Vàng: ${gameState.gold}.

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

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
        }
      });
      
      if (response && response.text) {
        let jsonResponse = response.text;
        try {
          const parsed = JSON.parse(jsonResponse);
          res.json(parsed);
        } catch (e) {
          console.error("JSON parse error:", e);
          res.status(500).json({ error: "Invalid JSON from AI" });
        }
      } else {
        res.status(500).json({ error: "Empty AI response" });
      }

    } catch (error) {
      console.error("Encounter API Error:", error);
      res.status(500).json({ error: "Internal server error" });
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
