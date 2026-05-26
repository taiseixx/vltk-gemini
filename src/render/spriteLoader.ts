import { getCachedFilteredImage } from "./imageCache";

export interface SpriteManifestItem {
  key: string;
  src: string;
  filterType: "raw" | "character" | "black";
  tolerance?: number;
}

export function loadAllSprites(
  manifest: SpriteManifestItem[],
  onProgress: (loaded: number) => void
): Promise<Record<string, CanvasImageSource>> {
  let loadedCount = 0;
  const results: Record<string, CanvasImageSource> = {};

  const promises = manifest.map((item) => {
    return new Promise<void>((resolve) => {
      const handleLoaded = (img: CanvasImageSource) => {
        results[item.key] = img;
        loadedCount++;
        onProgress(loadedCount);
        resolve();
      };

      if (item.filterType === "raw") {
        const img = new Image();
        img.onload = () => {
          handleLoaded(img);
        };
        img.onerror = () => {
          console.error(`Failed to load raw image: ${item.src}`);
          handleLoaded(img);
        };
        img.src = item.src;
      } else {
        getCachedFilteredImage(
          item.src,
          item.filterType,
          item.tolerance ?? 45,
          (img) => {
            handleLoaded(img);
          }
        );
      }
    });
  });

  return Promise.all(promises).then(() => results);
}
