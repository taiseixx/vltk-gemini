/**
 * Module-level cache of background-filtered sprite images.
 *
 * Prevents the pixel-level filtering in imageProcessing.ts from being
 * re-run on every component mount/remount. Keyed by source URL +
 * filter type + tolerance so the same image can be cached under multiple
 * filter variants.
 *
 * Boundary: render layer. Must NOT import from React or game/ modules.
 */

import { removeCharacterBackground, removeBlackBackground } from "./imageProcessing";

// Global Image Cache to prevent heavy Pixel-level Background Filtering on every component mount/remount
const GLOBAL_IMAGE_CACHE: Record<string, CanvasImageSource> = {};

export function getCachedFilteredImage(
  src: string,
  filterType: "character" | "black",
  tolerance = 45,
  onLoaded: (canvas: CanvasImageSource) => void
) {
  const cacheKey = `${src}_${filterType}_${tolerance}`;
  if (GLOBAL_IMAGE_CACHE[cacheKey]) {
    onLoaded(GLOBAL_IMAGE_CACHE[cacheKey]);
    return;
  }

  const img = new Image();
  img.onload = () => {
    let result: CanvasImageSource;
    if (filterType === "character") {
      result = removeCharacterBackground(img, tolerance);
    } else {
      result = removeBlackBackground(img, tolerance);
    }
    GLOBAL_IMAGE_CACHE[cacheKey] = result;
    onLoaded(result);
  };
  img.src = src;
}
