/**
 * Sprite manifest + bulk loader for game image assets.
 *
 * Wraps the callback-based getCachedFilteredImage into a Promise-based
 * batch loader. Caller supplies a manifest describing every image to load
 * (key, src URL, filter type, tolerance); the loader resolves with a
 * record keyed by manifest key once every image is ready, calling
 * onProgress(n) after each one finishes.
 *
 * The "none" filter type performs a raw Image load with no pixel filtering
 * (used for tileable background patterns like grass/stone where we WANT
 * the original colors).
 *
 * Boundary: render layer. Must NOT import from React or game/ modules.
 */

import { getCachedFilteredImage } from "./imageCache";

export type SpriteFilterType = "character" | "black" | "none";

export interface SpriteManifestEntry {
  key: string;
  src: string;
  filter: SpriteFilterType;
  tolerance?: number;
}

export type SpriteManifest = SpriteManifestEntry[];

function loadRawImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function loadOne(entry: SpriteManifestEntry): Promise<CanvasImageSource> {
  if (entry.filter === "none") {
    return loadRawImage(entry.src);
  }
  const filter = entry.filter;
  return new Promise((resolve) => {
    getCachedFilteredImage(entry.src, filter, entry.tolerance ?? 45, (canvas) => {
      resolve(canvas);
    });
  });
}

/**
 * Load every sprite in the manifest.
 *
 * onSpriteLoaded fires per-sprite the moment that sprite resolves —
 * use it to assign refs immediately (the same eager behavior the
 * original callback-based loader had). onProgress fires with the
 * cumulative count after each sprite.
 *
 * The returned promise resolves with a record of all loaded sprites
 * once the batch is done, for callers that prefer the bulk view.
 *
 * Failures from "none"-filter raw loads will reject the entire batch.
 * Filtered loads never call onerror in the underlying cache (current
 * behavior preserved).
 */
export async function loadAllSprites(
  manifest: SpriteManifest,
  onProgress?: (loaded: number) => void,
  onSpriteLoaded?: (key: string, img: CanvasImageSource) => void
): Promise<Record<string, CanvasImageSource>> {
  const out: Record<string, CanvasImageSource> = {};
  let loaded = 0;
  await Promise.all(
    manifest.map(async (entry) => {
      const img = await loadOne(entry);
      out[entry.key] = img;
      onSpriteLoaded?.(entry.key, img);
      loaded++;
      onProgress?.(loaded);
    })
  );
  return out;
}
