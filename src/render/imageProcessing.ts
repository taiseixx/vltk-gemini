/**
 * Pixel-level background-removal utilities for sprite images.
 *
 * Both functions run on the main thread and return a CanvasImageSource
 * (either the modified canvas or the original image on failure). They are
 * pure with respect to engine state — they only touch the Canvas2D API.
 *
 * Boundary: lives in the render layer. Must NOT import from React or
 * game/ modules.
 */

export function removeCharacterBackground(img: HTMLImageElement, tolerance = 35): CanvasImageSource {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return img;
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imgData.data;

    const corners = [
      { x: 2, y: 2 },
      { x: img.width - 3, y: 2 },
      { x: 2, y: img.height - 3 },
      { x: img.width - 3, y: img.height - 3 }
    ];

    let bgR = 0, bgG = 0, bgB = 0;
    let sampledCount = 0;
    corners.forEach(p => {
      if (p.x >= 0 && p.x < img.width && p.y >= 0 && p.y < img.height) {
        const idx = (p.y * img.width + p.x) * 4;
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
        sampledCount++;
      }
    });

    if (sampledCount > 0) {
      bgR = Math.round(bgR / sampledCount);
      bgG = Math.round(bgG / sampledCount);
      bgB = Math.round(bgB / sampledCount);
    }

    // Flood fill from corners instead of global replace to keep inner whites/blacks
    const visited = new Uint8Array(img.width * img.height);
    const queue: number[] = []; // store index

    // Push corners initially
    corners.forEach(p => {
      queue.push(p.y * img.width + p.x);
    });

    while(queue.length > 0) {
      const pIdx = queue.shift()!;
      if (visited[pIdx]) continue;

      const px = pIdx % img.width;
      const py = Math.floor(pIdx / img.width);

      const i = pIdx * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const diff = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);

      if (diff <= tolerance) {
        visited[pIdx] = 1;
        data[i + 3] = 0; // erase

        // Add neighbors
        if (px > 0 && !visited[pIdx - 1]) queue.push(pIdx - 1);
        if (px < img.width - 1 && !visited[pIdx + 1]) queue.push(pIdx + 1);
        if (py > 0 && !visited[pIdx - img.width]) queue.push(pIdx - img.width);
        if (py < img.height - 1 && !visited[pIdx + img.width]) queue.push(pIdx + img.width);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  } catch (err) {
    return img;
  }
}

export function removeBlackBackground(img: HTMLImageElement, tolerance = 45): CanvasImageSource {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return img;
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imgData.data;

    // Sample the corners to detect the natural background color
    const corners = [
      { x: 2, y: 2 },
      { x: img.width - 3, y: 2 },
      { x: 2, y: img.height - 3 },
      { x: img.width - 3, y: img.height - 3 }
    ];

    let bgR = 0, bgG = 0, bgB = 0;
    let sampledCount = 0;
    corners.forEach(p => {
      if (p.x >= 0 && p.x < img.width && p.y >= 0 && p.y < img.height) {
        const idx = (p.y * img.width + p.x) * 4;
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
        sampledCount++;
      }
    });

    if (sampledCount > 0) {
      bgR = Math.round(bgR / sampledCount);
      bgG = Math.round(bgG / sampledCount);
      bgB = Math.round(bgB / sampledCount);
    }

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const diff = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);

      // Safety fallbacks: absolute black & bright whites
      const isExtremeBlack = r < 40 && g < 40 && b < 40;

      // Catapult background is off-white (around 220-255). This targets any near-white pixels cleanly:
      const isExtremeWhite = r > 180 && g > 180 && b > 180 && Math.abs(r - g) < 25 && Math.abs(g - b) < 25;

      if (diff < tolerance || isExtremeBlack || isExtremeWhite) {
        data[i + 3] = 0;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas;
  } catch (err) {
    console.error("Alpha mask processing error:", err);
    return img;
  }
}
