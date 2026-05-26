import { removeCharacterBackground, removeBlackBackground } from "./imageProcessing";

// Global Image Cache to prevent heavy Pixel-level Background Filtering on every component mount/remount
export const GLOBAL_IMAGE_CACHE: Record<string, CanvasImageSource> = {};

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
      result = removeCharacterBackground(img as any, tolerance); // cast since types are identical CanvasImageSource
    } else {
      result = removeBlackBackground(img as any, tolerance);
    }
    GLOBAL_IMAGE_CACHE[cacheKey] = result;
    onLoaded(result);
  };
  img.src = src;
}
