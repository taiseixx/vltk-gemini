/**
 * World-level render helpers (loading screen, particles, floating texts).
 *
 * These functions operate on plain data arrays passed in by the caller —
 * no React refs, no game state shape knowledge beyond the param types.
 *
 * Boundary: render layer. Must NOT import from React or game/ modules.
 */

import type { Particle, FloatingText } from "../types";

const TIPS = [
  "💡 TIP: Nâng cấp Sinh Khí (CON) để sống sót lâu hơn trong những trận chiến kéo dài.",
  "💡 TIP: Khinh công (Thân Pháp) giúp tăng tỉ lệ chí mạng và tốc độ tiếp cận kẻ thù.",
  "💡 TIP: Bạn có thể sở hữu tối đa 2 Bí Kíp cùng lúc. Hãy kết hợp thông minh!",
  "💡 TIP: Nếu quá khó, hãy tập trung farm quái ở các ải đầu để tích lũy Vàng.",
  "💡 TIP: Linh thú (Đồng Hành) có thể tự động nhặt đồ và tấn công giúp bạn.",
  "💡 TIP: Ấn Tín (Seal) giúp tăng tầm đánh của các chưởng pháp rất hiệu quả.",
];

export function drawLoadingScreen(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  loaded: number,
  total: number,
  _color: string,
  time: number,
): void {
  ctx.fillStyle = '#050508'; // dark-bg
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;
  const progress = Math.min(1, loaded / total);

  // Dynamic large background icon based on time
  const EMOJIS = ['🪨', '🪵', '💧', '⚡', '🦂', '🎯', '❄️', '⚔️', '🔥'];
  const emojiIdx = Math.floor(time * 0.001) % EMOJIS.length;

  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.font = '200px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.translate(cx, cy - 40);
  ctx.rotate(Math.sin(time * 0.001) * 0.1);
  ctx.fillText(EMOJIS[emojiIdx], 0, 0);
  ctx.restore();

  // Large Golden Percentage
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 54px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Add glowing effect to text
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 20;
  ctx.fillText(`${Math.floor(progress * 100)}%`, cx, cy - 20);
  ctx.shadowBlur = 0;

  // Horizontal Progress Bar
  const barW = Math.min(400, canvasWidth * 0.8);
  const barH = 14;
  const barX = cx - barW / 2;
  const barY = cy + 40;

  // Background bar
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, barH / 2);
  ctx.fill();

  // Fill bar
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW * progress, barH, barH / 2);
  ctx.fill();

  // Add small highlight line to fill bar
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.roundRect(barX + 2, barY + 2, barW * progress - 4, barH / 2 - 2, (barH / 2 - 2) / 2);
  ctx.fill();

  // Tip Texts (changes every 4 seconds)
  const tipIdx = Math.floor(time * 0.00025) % TIPS.length;
  ctx.font = 'italic 14px serif';
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText(TIPS[tipIdx], cx, cy + 90);
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  cx: number,
  cy: number,
  viewWidth: number,
  viewHeight: number,
): void {
  ctx.save();
  particles.forEach((par) => {
    const px = par.x - cx;
    const py = par.y - cy;

    // OPTIMIZATION: Skip rendering for offscreen particles (massive performance boost!)
    if (
      px < -150 ||
      py < -150 ||
      px > viewWidth + 150 ||
      py > viewHeight + 150
    )
      return;

    const progress = par.maxLife ? 1 - (par.life / par.maxLife) : 0;
    const alpha = Math.max(0, par.life * 2); // fade out at end

    ctx.globalAlpha = Math.min(1, alpha);

    if (par.type === 'ring' || par.isBlast) {
      // Ground magic circle or expanding ring
      ctx.strokeStyle = par.color;
      ctx.lineWidth = 2 + progress * 5;
      ctx.beginPath();
      ctx.ellipse(px, py, par.size, par.size * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = par.color;
      ctx.globalAlpha = Math.min(0.3, alpha * 0.5);
      ctx.fill();
      ctx.globalAlpha = Math.min(1, alpha);
    } else if (par.type === 'shockwave') {
      // Very fast thin ring
      ctx.strokeStyle = par.color;
      ctx.lineWidth = Math.max(1, 10 - progress * 10);
      ctx.beginPath();
      ctx.arc(px, py, par.size, 0, Math.PI * 2);
      ctx.stroke();
    } else if (par.type === 'pillar') {
      // Light pillar coming down or shooting up
      const height = par.size * 5;
      const width = par.size;

    } else if (par.type === 'sword') {
      // Raining swords (optimized fast vector glow)
      ctx.translate(px, py);
      if (par.rotation) ctx.rotate(par.rotation);

      ctx.fillStyle = par.color;
      // Blade
      ctx.beginPath();
      ctx.moveTo(0, par.size * 2);
      ctx.lineTo(-par.size / 4, par.size);
      ctx.lineTo(-par.size / 4, -par.size * 2);
      ctx.lineTo(par.size / 4, -par.size * 2);
      ctx.lineTo(par.size / 4, par.size);
      ctx.fill();

      // Fast dual-blend neon glow replacing shadowBlur
      ctx.fillStyle = par.color;
      ctx.globalAlpha = 0.25 * alpha;
      ctx.fillRect(-par.size / 3, -par.size * 1.9, par.size * 0.66, par.size * 3.8);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-par.size / 6, -par.size * 1.8, par.size / 3, par.size * 3.5);

      if (par.rotation) ctx.rotate(-par.rotation);
      ctx.translate(-px, -py);
    } else if (par.type === 'trail') {
      // Double-circle aura simulation (100x faster than shadowBlur)
      ctx.fillStyle = par.color;
      ctx.globalAlpha = 0.3 * alpha;
      ctx.beginPath();
      ctx.arc(px, py, par.size * 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(px, py, par.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (par.type === 'beam') {
      // Clean double-layered glowing beam
      ctx.strokeStyle = par.color;
      ctx.lineWidth = Math.max(3, par.size * (par.life / 0.8) * 3.5);
      ctx.globalAlpha = 0.25 * alpha;
      ctx.beginPath();
      ctx.moveTo(px - 1000, py);
      ctx.lineTo(px + 1000, py);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1, par.size * (par.life / 0.8) * 1.1);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(px - 1000, py);
      ctx.lineTo(px + 1000, py);
      ctx.stroke();
    } else if (par.type === 'lightning') {
      // Collect coordinates once for double-pass consistent coordinates without random shifts
      const pts: { x: number; y: number }[] = [{ x: px, y: py - 500 }];
      let cyy = py - 500;
      let cxx = px;
      while (cyy < py) {
        cyy += 30 + Math.random() * 40;
        cxx += (Math.random() - 0.5) * 50;
        pts.push({ x: cxx, y: cyy });
      }

      // Draw outer thick color aura
      ctx.strokeStyle = par.color;
      ctx.lineWidth = 5 + Math.random() * 3;
      ctx.globalAlpha = 0.35 * alpha;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();

      // Draw inner intense hot-white center core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5 + Math.random() * 1.5;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
    } else {
      // Default dot
      ctx.fillStyle = par.color;
      ctx.fillRect(px, py, Math.max(1, par.size), Math.max(1, par.size));
    }
  });
  ctx.restore();
}

export function drawFloatingTexts(
  ctx: CanvasRenderingContext2D,
  texts: FloatingText[],
  cx: number,
  cy: number,
): void {
  ctx.font = "bold 16px font-serif";
  ctx.textAlign = "center";
  texts.forEach((t) => {
    ctx.fillStyle = t.color;
    ctx.globalAlpha = t.life;
    ctx.fillText(t.text, t.x - cx, t.y - cy);
  });
  ctx.globalAlpha = 1;
}
