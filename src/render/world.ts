import { Particle, FloatingText, Drop, Entity, GameState } from "../types";
import { RARITY_COLORS, MAP_SIZE } from "../constants";
import { drawHuman } from "./character";
import { getSectIdFromColor } from "../game/elements";

export interface SceneryElement {
  x: number;
  y: number;
  t: number;
  sz: number;
}

export interface DrawLoadingScreenParams {
  canvasWidth: number;
  canvasHeight: number;
  loaded: number;
  total: number;
  color: string;
  time: number;
}

const TIPS = [
  "💡 TIP: Nâng cấp Sinh Khí (CON) để sống sót lâu hơn trong những trận chiến kéo dài.",
  "💡 TIP: Khinh công (Thân Pháp) giúp tăng tỉ lệ chí mạng và tốc độ tiếp cận kẻ thù.",
  "💡 TIP: Bạn có thể sở hữu tối đa 2 Bí Kíp cùng lúc. Hãy kết hợp thông minh!",
  "💡 TIP: Nếu quá khó, hãy tập trung farm quái ở các ải đầu để tích lũy Vàng.",
  "💡 TIP: Linh thú (Đồng Hành) có thể tự động nhặt đồ và tấn công giúp bạn.",
  "💡 TIP: Ấn Tín (Seal) giúp tăng tầm đánh của các chưởng pháp rất hiệu quả."
];

export function drawLoadingScreen(
  ctx: CanvasRenderingContext2D,
  params: DrawLoadingScreenParams
): void {
  const { canvasWidth, canvasHeight, loaded, total, color, time } = params;

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
  ctx.textAlign = 'center';
  ctx.fillText(TIPS[tipIdx], cx, cy + 90);
}

export interface DrawSceneryParams {
  scenery: SceneryElement[];
  cx: number;
  cy: number;
  viewWidth: number;
  viewHeight: number;
  lanternImg: CanvasImageSource | null;
  barricadeImg: CanvasImageSource | null;
  treeImg: CanvasImageSource | null;
  flagImg: CanvasImageSource | null;
  catapultImg: CanvasImageSource | null;
  fenceImg: CanvasImageSource | null;
}

export function drawScenery(
  ctx: CanvasRenderingContext2D,
  params: DrawSceneryParams
): void {
  const {
    scenery,
    cx,
    cy,
    viewWidth,
    viewHeight,
    lanternImg,
    barricadeImg,
    treeImg,
    flagImg,
    catapultImg,
    fenceImg,
  } = params;

  scenery.forEach((s) => {
    const sx = s.x - cx;
    const sy = s.y - cy;
    if (
      sx < -100 ||
      sy < -100 ||
      sx > viewWidth + 100 ||
      sy > viewHeight + 100
    )
      return;

    if (s.t === 0) {
      if (lanternImg) {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.32)";
        ctx.beginPath();
        ctx.ellipse(sx, sy + s.sz * 0.1, s.sz * 0.45, s.sz * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.imageSmoothingEnabled = true;
        const imgW = s.sz * 1.45;
        const imgH = s.sz * 2.15;
        ctx.drawImage(lanternImg, sx - imgW / 2, sy - imgH * 0.85, imgW, imgH);
        ctx.restore();
      } else {
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.beginPath();
        ctx.ellipse(sx, sy, s.sz * 0.4, s.sz * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#7f8c8d";
        ctx.fillRect(sx - s.sz * 0.1, sy - s.sz * 0.6, s.sz * 0.2, s.sz * 0.6);
        ctx.fillStyle = "#95a5a6";
        ctx.fillRect(sx - s.sz * 0.3, sy - s.sz * 0.8, s.sz * 0.6, s.sz * 0.2);
        ctx.fillStyle = "#ffb300";
        ctx.fillRect(sx - s.sz * 0.2, sy - s.sz * 1.1, s.sz * 0.4, s.sz * 0.3);
        ctx.fillStyle = "#34495e";
        ctx.beginPath();
        ctx.moveTo(sx, sy - s.sz * 1.4);
        ctx.lineTo(sx - s.sz * 0.4, sy - s.sz * 1.1);
        ctx.lineTo(sx + s.sz * 0.4, sy - s.sz * 1.1);
        ctx.fill();
      }
    } else if (s.t === 1) {
      if (barricadeImg) {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.beginPath();
        ctx.ellipse(sx, sy + s.sz * 0.15, s.sz * 1.25, s.sz * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.imageSmoothingEnabled = true;
        const imgW = s.sz * 2.3;
        const imgH = s.sz * 1.7;
        ctx.drawImage(barricadeImg, sx - imgW / 2, sy - imgH * 0.72, imgW, imgH);
        ctx.restore();
      } else {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.beginPath();
        ctx.ellipse(sx, sy, s.sz, s.sz * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#5c4033";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(sx - s.sz * 0.8, sy - s.sz * 0.4);
        ctx.lineTo(sx + s.sz * 0.8, sy - s.sz * 0.4);
        ctx.stroke();

        ctx.strokeStyle = "#7f8c8d";
        ctx.lineWidth = 3;
        for (let sp = -s.sz * 0.6; sp <= s.sz * 0.6; sp += 15) {
           ctx.beginPath();
           ctx.moveTo(sx + sp, sy - s.sz * 0.4);
           ctx.lineTo(sx + sp + 5, sy - s.sz * 1.2);
           ctx.stroke();
        }
      }
    } else if (s.t === 2) {
      if (treeImg) {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.ellipse(sx, sy + s.sz * 0.1, s.sz * 1.0, s.sz * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.imageSmoothingEnabled = true;
        const imgW = s.sz * 2.5;
        const imgH = s.sz * 2.8;
        ctx.drawImage(treeImg, sx - imgW / 2, sy - imgH * 0.85, imgW, imgH);
        ctx.restore();
      } else {
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.ellipse(sx, sy, s.sz * 0.8, s.sz * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#5d4037";
        ctx.beginPath();
        ctx.moveTo(sx - s.sz * 0.1, sy);
        ctx.lineTo(sx - s.sz * 0.2, sy - s.sz * 1.5);
        ctx.lineTo(sx + s.sz * 0.2, sy - s.sz * 1.5);
        ctx.lineTo(sx + s.sz * 0.1, sy);
        ctx.fill();

        ctx.fillStyle = "#2e7d32";
        ctx.beginPath();
        ctx.ellipse(sx, sy - s.sz * 1.8, s.sz * 1.5, s.sz * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#43a047";
        ctx.beginPath();
        ctx.ellipse(
          sx - s.sz * 0.3,
          sy - s.sz * 2.2,
          s.sz * 1.1,
          s.sz * 0.8,
          Math.PI / 4,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    } else if (s.t === 3) {
      if (flagImg) {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath();
        ctx.ellipse(sx, sy + s.sz * 0.1, s.sz * 0.5, s.sz * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.imageSmoothingEnabled = true;
        const imgW = s.sz * 1.8;
        const imgH = s.sz * 2.9;
        ctx.drawImage(flagImg, sx - imgW / 2, sy - imgH * 0.88, imgW, imgH);
        ctx.restore();
      } else {
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.ellipse(sx, sy, s.sz * 0.3, s.sz * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#d35400";
        ctx.fillRect(sx - 2, sy - s.sz * 2.5, 4, s.sz * 2.5);

        ctx.fillStyle = "#c0392b";
        ctx.beginPath();
        ctx.moveTo(sx, sy - s.sz * 2.4);
        ctx.lineTo(sx + s.sz * 0.8, sy - s.sz * 2.4);
        ctx.lineTo(sx + s.sz * 0.8, sy - s.sz);
        ctx.lineTo(sx + s.sz * 0.4, sy - s.sz * 1.2);
        ctx.lineTo(sx, sy - s.sz);
        ctx.fill();

        ctx.strokeStyle = "#f1c40f";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx + s.sz * 0.2, sy - s.sz * 2.0);
        ctx.lineTo(sx + s.sz * 0.6, sy - s.sz * 2.0);
        ctx.moveTo(sx + s.sz * 0.4, sy - s.sz * 2.2);
        ctx.lineTo(sx + s.sz * 0.4, sy - s.sz * 1.5);
        ctx.moveTo(sx + s.sz * 0.2, sy - s.sz * 1.7);
        ctx.lineTo(sx + s.sz * 0.6, sy - s.sz * 1.7);
        ctx.stroke();
      }
    } else if (s.t === 4) {
      if (catapultImg) {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath();
        ctx.ellipse(sx, sy + s.sz * 0.15, s.sz * 1.25, s.sz * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.imageSmoothingEnabled = true;
        const imgW = s.sz * 2.2;
        const imgH = s.sz * 2.0;
        ctx.drawImage(catapultImg, sx - imgW / 2, sy - imgH * 0.76, imgW, imgH);
        ctx.restore();
      } else {
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.ellipse(sx, sy, s.sz * 1.1, s.sz * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#8d6e63";
        ctx.fillRect(sx - s.sz * 0.8, sy - s.sz * 0.2, s.sz * 1.6, s.sz * 0.3);
        ctx.fillRect(sx - s.sz * 0.1, sy - s.sz * 1.0, s.sz * 0.2, s.sz * 0.9);

        ctx.fillStyle = "#3e2723";
        ctx.beginPath();
        ctx.arc(sx - s.sz * 0.6, sy + s.sz * 0.1, s.sz * 0.25, 0, Math.PI * 2);
        ctx.arc(sx + s.sz * 0.6, sy + s.sz * 0.1, s.sz * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = "#d7ccc8";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.strokeStyle = "#5d4037";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(sx + s.sz * 0.3, sy - s.sz * 0.1);
        ctx.lineTo(sx - s.sz * 0.9, sy - s.sz * 1.2);
        ctx.stroke();

        ctx.fillStyle = "#9e9e9e";
        ctx.beginPath();
        ctx.arc(sx - s.sz * 0.9, sy - s.sz * 1.2, s.sz * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (s.t === 5) {
      if (fenceImg) {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.beginPath();
        ctx.ellipse(sx, sy + s.sz * 0.12, s.sz * 1.15, s.sz * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.imageSmoothingEnabled = true;
        const imgW = s.sz * 2.2;
        const imgH = s.sz * 1.6;
        ctx.drawImage(fenceImg, sx - imgW / 2, sy - imgH * 0.72, imgW, imgH);
        ctx.restore();
      } else {
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath();
        ctx.ellipse(sx, sy, s.sz * 1.0, s.sz * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#a1887f";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(sx - s.sz * 0.7, sy + s.sz * 0.1);
        ctx.lineTo(sx + s.sz * 0.5, sy - s.sz * 1.1);
        ctx.moveTo(sx + s.sz * 0.7, sy + s.sz * 0.1);
        ctx.lineTo(sx - s.sz * 0.5, sy - s.sz * 1.1);
        ctx.moveTo(sx - s.sz * 0.8, sy - s.sz * 0.45);
        ctx.lineTo(sx + s.sz * 0.8, sy - s.sz * 0.45);
        ctx.stroke();
      }
    }
  });
}

export interface DrawParticlesParams {
  particles: Particle[];
  cx: number;
  cy: number;
  viewWidth: number;
  viewHeight: number;
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  params: DrawParticlesParams
): void {
  const { particles, cx, cy, viewWidth, viewHeight } = params;

  ctx.save();
  particles.forEach((par) => {
    const px = par.x - cx;
    const py = par.y - cy;
    
    // OPTIMIZATION: Skip rendering for offscreen particles
    if (
      px < -150 ||
      py < -150 ||
      px > viewWidth + 150 ||
      py > viewHeight + 150
    )
      return;

    const progress = par.maxLife ? 1 - (par.life / par.maxLife) : 0;
    const alpha = Math.max(0, par.life * 2);
    
    ctx.globalAlpha = Math.min(1, alpha);
    
    if (par.type === 'ring' || par.isBlast) {
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
      ctx.strokeStyle = par.color;
      ctx.lineWidth = Math.max(1, 10 - progress * 10);
      ctx.beginPath();
      ctx.arc(px, py, par.size, 0, Math.PI * 2);
      ctx.stroke();
    } else if (par.type === 'pillar') {
      const height = par.size * 5;
      const width = par.size;
      ctx.fillStyle = par.color;
      ctx.globalAlpha = 0.35 * alpha;
      ctx.fillRect(px - width / 2, py - height, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = alpha;
      ctx.fillRect(px - width / 4, py - height, width / 2, height);
    } else if (par.type === 'sword') {
      ctx.translate(px, py);
      if (par.rotation) ctx.rotate(par.rotation);
      
      ctx.fillStyle = par.color;
      ctx.beginPath();
      ctx.moveTo(0, par.size * 2);
      ctx.lineTo(-par.size / 4, par.size);
      ctx.lineTo(-par.size / 4, -par.size * 2);
      ctx.lineTo(par.size / 4, -par.size * 2);
      ctx.lineTo(par.size / 4, par.size);
      ctx.fill();
      
      ctx.fillStyle = par.color;
      ctx.globalAlpha = 0.25 * alpha;
      ctx.fillRect(-par.size / 3, -par.size * 1.9, par.size * 0.66, par.size * 3.8);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-par.size / 6, -par.size * 1.8, par.size / 3, par.size * 3.5);
      
      if (par.rotation) ctx.rotate(-par.rotation);
      ctx.translate(-px, -py);
    } else if (par.type === 'trail') {
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
      const pts: { x: number; y: number }[] = [{ x: px, y: py - 500 }];
      let cyy = py - 500;
      let cxx = px;
      while (cyy < py) {
        cyy += 30 + Math.random() * 40;
        cxx += (Math.random() - 0.5) * 50;
        pts.push({ x: cxx, y: cyy });
      }

      ctx.strokeStyle = par.color;
      ctx.lineWidth = 5 + Math.random() * 3;
      ctx.globalAlpha = 0.35 * alpha;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();

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
      ctx.fillStyle = par.color;
      ctx.fillRect(px, py, Math.max(1, par.size), Math.max(1, par.size));
    }
  });
  ctx.restore();
}

export interface DrawDropsParams {
  drops: Drop[];
  cx: number;
  cy: number;
  viewWidth: number;
  viewHeight: number;
  time: number;
}

export function drawDrops(
  ctx: CanvasRenderingContext2D,
  params: DrawDropsParams
): void {
  const { drops, cx, cy, viewWidth, viewHeight, time } = params;

  drops.forEach((d) => {
    const dx = d.x - cx;
    const dy = d.y - cy;
    
    // OPTIMIZATION: Skip rendering for offscreen drops
    if (
      dx < -100 ||
      dy < -100 ||
      dx > viewWidth + 100 ||
      dy > viewHeight + 100
    )
      return;

    const rColor = RARITY_COLORS[d.rarity] || "#ffffff";
    const isSuperRare = d.rarity === 'pink' || d.rarity === 'crimson' || d.rarity === 'gold_rarity';
    const baseRadius = isSuperRare ? 38 : 26;
    
    // Gentle breathing scale factor
    const pulse = 1 + Math.sin(time * 0.003) * 0.08;
    const auraRadius = baseRadius * pulse;
    
    // 1. Majestic Luminous Light Aura (Hào quang linh diệu) using high-performance Radial Gradients
    ctx.save();
    const grad = ctx.createRadialGradient(dx, dy, d.rarity === 'pink' || d.rarity === 'crimson' ? 4 : 2, dx, dy, auraRadius);
    grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    grad.addColorStop(0.2, `${rColor}cc`);
    grad.addColorStop(0.6, `${rColor}33`);
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(dx, dy, auraRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // 2. Slow, majestic rotating light rays / divine flares
    ctx.save();
    const slowAngle = (time * 0.0005) % (Math.PI * 2);
    ctx.translate(dx, dy);
    ctx.rotate(slowAngle);
    
    ctx.fillStyle = rColor;
    ctx.globalAlpha = 0.35 + Math.sin(time * 0.004) * 0.1;
    
    const rayLength = auraRadius * 1.35;
    const rayWidth = isSuperRare ? 4 : 2.5;
    
    ctx.beginPath();
    // Upward Ray
    ctx.moveTo(0, -rayLength);
    ctx.lineTo(rayWidth, 0);
    ctx.lineTo(-rayWidth, 0);
    // Downward Ray
    ctx.moveTo(0, rayLength);
    ctx.lineTo(rayWidth, 0);
    ctx.lineTo(-rayWidth, 0);
    // Rightward Ray
    ctx.moveTo(rayLength, 0);
    ctx.lineTo(0, rayWidth);
    ctx.lineTo(0, -rayWidth);
    // Leftward Ray
    ctx.moveTo(-rayLength, 0);
    ctx.lineTo(0, rayWidth);
    ctx.lineTo(0, -rayWidth);
    ctx.fill();
    
    if (isSuperRare) {
      ctx.rotate(Math.PI / 4);
      const subLength = rayLength * 0.7;
      ctx.beginPath();
      ctx.moveTo(0, -subLength);
      ctx.lineTo(rayWidth * 0.7, 0);
      ctx.lineTo(-rayWidth * 0.7, 0);
      ctx.moveTo(0, subLength);
      ctx.lineTo(rayWidth * 0.7, 0);
      ctx.lineTo(-rayWidth * 0.7, 0);
      ctx.moveTo(subLength, 0);
      ctx.lineTo(0, rayWidth * 0.7);
      ctx.lineTo(0, -rayWidth * 0.7);
      ctx.moveTo(-subLength, 0);
      ctx.lineTo(0, rayWidth * 0.7);
      ctx.lineTo(0, -rayWidth * 0.7);
      ctx.fill();
    }
    
    ctx.restore();
    
    // 4. Center item chest shadow
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.ellipse(dx, dy + 10, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // 5. Draw the item box itself
    ctx.save();
    ctx.fillStyle = rColor;
    ctx.beginPath();
    ctx.arc(dx, dy, 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "#000";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("📦", dx, dy + 4);
    ctx.restore();
    
    // 6. Draw floating item name metadata panel
    ctx.save();
    ctx.font = "bold 9px Arial";
    
    const hanBadges = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    const curBadge = hanBadges[d.tier || 1] || '一';
    const badgeText = `${d.name} (Đảng ${curBadge})`;
    const textWidth = ctx.measureText(badgeText).width;
    
    ctx.fillStyle = "rgba(10, 10, 15, 0.85)";
    ctx.strokeStyle = rColor;
    ctx.lineWidth = 1;
    
    const bx = dx - textWidth / 2 - 6;
    const by = dy - 28;
    const bw = textWidth + 12;
    const bh = 14;
    
    ctx.beginPath();
    ctx.rect(bx, by, bw, bh);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = rColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(badgeText, dx, dy - 21);
    ctx.restore();
  });
}

export interface DrawFloatingTextsParams {
  texts: FloatingText[];
  cx: number;
  cy: number;
}

export function drawFloatingTexts(
  ctx: CanvasRenderingContext2D,
  params: DrawFloatingTextsParams
): void {
  const { texts, cx, cy } = params;

  ctx.save();
  ctx.font = "bold 16px font-serif";
  ctx.textAlign = "center";
  texts.forEach((t) => {
    ctx.fillStyle = t.color;
    ctx.globalAlpha = t.life;
    ctx.fillText(t.text, t.x - cx, t.y - cy);
  });
  ctx.globalAlpha = 1;
  ctx.restore();
}

export interface DrawEntitiesParams {
  entities: Entity[];
  cx: number;
  cy: number;
  viewWidth: number;
  viewHeight: number;
  player: GameState["player"];
  time: number;
  images: {
    playerSprite: CanvasImageSource | null;
    bossSprite: CanvasImageSource | null;
    mobSprite: CanvasImageSource | null;
    playerSectSprites: Record<string, CanvasImageSource | null>;
  };
}

export function drawEntities(
  ctx: CanvasRenderingContext2D,
  params: DrawEntitiesParams
): void {
  const { entities, cx, cy, viewWidth, viewHeight, player, time, images } = params;

  entities.forEach((e) => {
    const ex = e.x - cx;
    const ey = e.y - cy;
    if (
      ex < -50 ||
      ey < -50 ||
      ex > viewWidth + 50 ||
      ey > viewHeight + 50
    )
      return;

    const isMoving =
      Math.hypot(player.x - e.x, player.y - e.y) > player.radius + e.size + 5 && e.atkCd > 0;
    drawHuman(ctx, {
      x: ex,
      y: ey,
      sz: e.size,
      c: e.color,
      facing: e.x > player.x ? -1 : 1,
      isBoss: e.isBoss,
      moving: isMoving,
      time,
      images,
    });

    // Entity Name if Boss
    if (e.isBoss && e.name) {
      ctx.fillStyle = e.isSubBoss ? "#e67e22" : "#9b59b6";
      ctx.font = "bold 13px 'Courier New', Courier, monospace";
      ctx.textAlign = "center";
      
      ctx.shadowColor = "black";
      ctx.shadowBlur = 4;
      ctx.lineWidth = 2;
      ctx.strokeText(e.name, ex, ey - e.size - 25);
      ctx.shadowBlur = 0;
      ctx.fillText(e.name, ex, ey - e.size - 25);
    }

    // HP Bar
    ctx.fillStyle = "#000";
    ctx.fillRect(ex - 20, ey - e.size - 15, 40, 5);
    ctx.fillStyle = e.isBoss ? "#f1c40f" : "#e74c3c";
    ctx.fillRect(ex - 20, ey - e.size - 15, 40 * Math.max(0, Math.min(1, e.hp / e.maxHp)), 5);

    // Draw element indicator next to HP Bar
    if (e.element) {
      const elColor = { Metal: '#f1c40f', Wood: '#2ecc71', Water: '#3498db', Fire: '#e74c3c', Earth: '#e67e22' };
      const elEmoji = { Metal: '⚡', Wood: '🍃', Water: '💧', Fire: '🔥', Earth: '⛰️' };
      ctx.fillStyle = elColor[e.element] || '#fff';
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(elEmoji[e.element], ex - 24, ey - e.size - 10);
    }

    // Target ring
    if (player.target?.id === e.id) {
      ctx.strokeStyle = "#e74c3c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(ex, ey + e.size, e.size, e.size * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}

export interface DrawPlayerParams {
  player: GameState["player"];
  companion: GameState["companion"];
  cx: number;
  cy: number;
  time: number;
  images: {
    playerSprite: CanvasImageSource | null;
    bossSprite: CanvasImageSource | null;
    mobSprite: CanvasImageSource | null;
    playerSectSprites: Record<string, CanvasImageSource | null>;
  };
  companionSectSprites: Record<string, CanvasImageSource | null>;
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  params: DrawPlayerParams
): void {
  const { player: p, companion: comp, cx, cy, time, images, companionSectSprites } = params;

  if (p.dead) return;

  const px = p.x - cx;
  const py = p.y - cy;

  // Banner aura passive battlefield design (Highly optimized with nested strokes)
  if (p.equipment.banner !== null) {
    ctx.save();
    // Thick low-opacity outer glow ring
    ctx.strokeStyle = "rgba(243, 156, 18, 0.22)"; 
    ctx.lineWidth = 12.0;
    ctx.beginPath();
    ctx.ellipse(px, py + p.radius, 160, 64, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Solid golden inner ring
    ctx.strokeStyle = "rgba(243, 156, 18, 0.85)";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.ellipse(px, py + p.radius, 160, 64, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.translate(px, py + p.radius);
    ctx.strokeStyle = "rgba(243, 156, 18, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 160, 64, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Draw multiple rotating glowing fire dots/particles around the concentric ellipse track
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const angle = (time * 0.0018 + (i * Math.PI * 2) / particleCount) % (Math.PI * 2);
      const rx = Math.cos(angle) * 160;
      const ry = Math.sin(angle) * 64;
      
      ctx.fillStyle = i % 2 === 0 ? "#ff8c00" : "#ffed4a";
      ctx.beginPath();
      ctx.arc(rx, ry, 5 + Math.sin(time * 0.006 + i) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Banner text flag floating tag
    ctx.save();
    ctx.font = "bold 13px font-serif";
    ctx.fillStyle = "#f39c12";
    ctx.textAlign = "center";
    ctx.fillText("🚩 QUÂN KỲ", px, py - 38);
    ctx.restore();
  }

  ctx.strokeStyle = p.color + "88";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(px, py + p.radius, 25, 10, 0, 0, Math.PI * 2);
  ctx.stroke();
  drawHuman(ctx, {
    x: px,
    y: py,
    sz: 18,
    c: p.color,
    facing: p.facing,
    isBoss: false,
    moving: p.moving,
    time,
    hasCloak: p.equipment.cloak !== null,
    sectId: p.sectId,
    images,
  });

  // Render Flying/Orbiting Companion Animal Mascot (Beast Companion)
  if (comp) {
    const orbitRadius = 45;
    const speedMult = 0.003;
    const angle = time * speedMult;
    const petX = px + Math.cos(angle) * orbitRadius;
    const petY = py + Math.sin(angle) * orbitRadius - 10;
    
    // Draw a tiny shadow under the mascot
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(petX, petY + 14, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw mascot emoji or custom sect-specific sprite!
    ctx.save();
    const compSectId = getSectIdFromColor(p.color);
    const compSprite = compSectId ? companionSectSprites[compSectId] : null;
    if (compSprite) {
      const compW = 28;
      const compH = 28;
      ctx.drawImage(compSprite, petX - compW / 2, petY - compH / 2, compW, compH);
    } else {
      ctx.font = "18px Arial";
      ctx.textAlign = "center";
      ctx.fillText(comp.emoji || "🐯", petX, petY);
    }
    
    // Render companion level above
    ctx.font = "bold 9px font-sans";
    ctx.fillStyle = "#f39c12";
    ctx.textAlign = "center";
    ctx.fillText(`Lg. ${comp.level || 1}`, petX, petY - 16);
    ctx.restore();
  }
}

export interface DrawMinimapParams {
  canvasWidth: number;
  canvasHeight: number;
  entities: Entity[];
  player: GameState["player"];
}

export function drawMinimap(
  ctx: CanvasRenderingContext2D,
  params: DrawMinimapParams
): void {
  const { canvasWidth, canvasHeight, entities, player: p } = params;

  const isMobile = canvasWidth < 768;
  const mmSize = isMobile ? 80 : 120;
  const mmX = isMobile ? 12 : 32;
  const mmY = isMobile ? 95 : 115;

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.strokeStyle = "rgba(212,175,55,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(mmX + mmSize / 2, mmY + mmSize / 2, mmSize / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.arc(mmX + mmSize / 2, mmY + mmSize / 2, mmSize / 2, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(mmX, mmY, mmSize, mmSize);

  const mapScale = mmSize / MAP_SIZE;
  entities.forEach((e) => {
    ctx.fillStyle = e.isBoss ? "#f1c40f" : "#e74c3c";
    ctx.beginPath();
    ctx.arc(
      mmX + e.x * mapScale,
      mmY + e.y * mapScale,
      e.isBoss ? 4 : 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  });

  if (!p.dead) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(mmX + p.x * mapScale, mmY + p.y * mapScale, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
