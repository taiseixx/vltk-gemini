import { MAP_SIZE } from "../constants";

export interface DrawBackgroundParams {
  cx: number;
  cy: number;
  viewWidth: number;
  viewHeight: number;
  cycle: number;
  grassImg: HTMLImageElement | null;
  stoneImg: HTMLImageElement | null;
}

// Simple internal pattern cache to keep rendering extremely high-performance
let grassPattern: CanvasPattern | null = null;
let stonePattern: CanvasPattern | null = null;

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  params: DrawBackgroundParams
): void {
  const { cx, cy, viewWidth, viewHeight, cycle, grassImg, stoneImg } = params;

  ctx.save();
  ctx.translate(-cx, -cy);

  // Fill the battlefield MAP_SIZE with a healthy base solid color
  let biomeMapFill = "#22472b"; // default forest - rich warm green
  if (cycle === 1) biomeMapFill = "#6e5235"; // Desert - golden warm sands 
  else if (cycle === 2) biomeMapFill = "#32455c"; // Mountain/Ice - solid ice-blue mountain terrain
  else if (cycle === 3) biomeMapFill = "#344e3a"; // Plains - prairie green
  
  const margin = 200;
  const clipX = Math.max(0, cx - margin);
  const clipY = Math.max(0, cy - margin);
  const clipW = Math.min(MAP_SIZE - clipX, viewWidth + margin * 2);
  const clipH = Math.min(MAP_SIZE - clipY, viewHeight + margin * 2);

  ctx.fillStyle = biomeMapFill;
  ctx.fillRect(clipX, clipY, clipW, clipH);

  const isStone = (cycle === 1 || cycle === 2);
  let pattern: CanvasPattern | null = null;

  if (isStone) {
    if (stonePattern) {
      pattern = stonePattern;
    } else if (stoneImg) {
      try {
        const pat = ctx.createPattern(stoneImg, "repeat");
        if (pat) {
          try {
            const matrix = new DOMMatrix();
            matrix.scaleSelf(0.22, 0.22);
            pat.setTransform(matrix);
          } catch (e) {}
          stonePattern = pat;
          pattern = pat;
        }
      } catch (err) {}
    }
  } else {
    if (grassPattern) {
      pattern = grassPattern;
    } else if (grassImg) {
      try {
        const pat = ctx.createPattern(grassImg, "repeat");
        if (pat) {
          try {
            const matrix = new DOMMatrix();
            matrix.scaleSelf(0.22, 0.22);
            pat.setTransform(matrix);
          } catch (e) {}
          grassPattern = pat;
          pattern = pat;
        }
      } catch (err) {}
    }
  }

  if (pattern) {
    try {
      ctx.fillStyle = pattern;
      ctx.fillRect(clipX, clipY, clipW, clipH);

      // Apply beautiful watercolor aesthetic composite tint based on biome cycle (using soft overlays)
      if (cycle === 0) {
        // Forest - Lush Deep Jade Green
        ctx.fillStyle = "rgba(10, 40, 15, 0.25)";
      } else if (cycle === 1) {
        // Desert - Golden Dun
        ctx.fillStyle = "rgba(200, 120, 20, 0.22)";
      } else if (cycle === 2) {
        // Mountain - Ice Frost Blue
        ctx.fillStyle = "rgba(140, 180, 220, 0.22)";
      } else {
        // Plains - Soft Olive Ink
        ctx.fillStyle = "rgba(40, 60, 40, 0.18)";
      }
      ctx.fillRect(clipX, clipY, clipW, clipH);
    } catch (err) {}
  }

  // World coordinate grid / Grass details
  ctx.save();
  let gridColor = "rgba(32, 58, 37, 0.4)";
  if (cycle === 1) gridColor = "rgba(110, 80, 40, 0.35)";
  else if (cycle === 2) gridColor = "rgba(80, 110, 150, 0.35)";
  else if (cycle === 3) gridColor = "rgba(40, 70, 50, 0.35)";
  
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1.5;
  const tileSize = 80;

  // Determine bounds in world space to draw only what's visible
  const startX = Math.floor(cx / tileSize) * tileSize - tileSize;
  const startY = Math.floor(cy / tileSize) * tileSize - tileSize;
  const endX = cx + viewWidth + tileSize;
  const endY = cy + viewHeight + tileSize;

  // Pattern instead of solid grid
  ctx.beginPath();
  for (let x = startX; x <= endX; x += tileSize) {
    ctx.moveTo(x, cy - tileSize);
    ctx.lineTo(x, cy + viewHeight + tileSize);
  }
  for (let y = startY; y <= endY; y += tileSize) {
    ctx.moveTo(cx - tileSize, y);
    ctx.lineTo(cx + viewWidth + tileSize, y);
  }
  ctx.globalAlpha = 0.3; // Make grid subtle
  ctx.stroke();
  
  // Draw grass blades and textures inside tiles (sparsely for massive performance boost)
  ctx.globalAlpha = 0.8;
  let detailColor = "#203a25"; // Forest
  if (cycle === 1) detailColor = "#523f2b"; // Desert
  else if (cycle === 2) detailColor = "#2b3b4f"; // Mountain
  else if (cycle === 3) detailColor = "#293e2f"; // Plains
  
  ctx.strokeStyle = detailColor;
  ctx.lineWidth = 1;
  for (let x = startX; x < endX; x += tileSize * 3) {
    for (let y = startY; y < endY; y += tileSize * 3) {
      // Randomly place some grass marks
      const gx = x + (Math.abs(x * 13) % tileSize);
      const gy = y + (Math.abs(y * 17) % tileSize);
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + 4, gy - 8);
      ctx.moveTo(gx + 2, gy);
      ctx.lineTo(gx + 8, gy - 6);
      ctx.stroke();
    }
  }
  ctx.restore();

  ctx.restore();
}
