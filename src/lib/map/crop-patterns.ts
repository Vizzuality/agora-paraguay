import type { Map } from 'maplibre-gl';

import type { Crop } from '@/lib/api/metadata/schemas';

type PatternImage = { width: number; height: number; data: Uint8ClampedArray };

/** The style image a parcel's last crop repeats: stripes for soy, dots for rice. */
export const CROP_PATTERN_IDS: Record<Crop, string> = {
  soja: 'crop-soja-stripes',
  rice: 'crop-rice-dots',
};

/** A square tile of opaque white marks on transparent; layer opacity sets their strength. */
function tile(size: number, isMark: (x: number, y: number) => boolean): PatternImage {
  const data = new Uint8ClampedArray(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!isMark(x, y)) continue;
      data.fill(255, (y * size + x) * 4, (y * size + x + 1) * 4);
    }
  }

  return { width: size, height: size, data };
}

/** 2px diagonal stripes every 5px, rising to the right. */
export function stripesImage(): PatternImage {
  return tile(10, (x, y) => [1, 2].includes((x + Math.floor((y + 1) / 2)) % 5));
}

/** 2px square dots on an 8px grid, every other row shifted half a step. */
export function dotsImage(): PatternImage {
  return tile(8, (x, y) => y % 4 < 2 && (x + (y < 4 ? 0 : 4)) % 8 < 2);
}

const PATTERN_IMAGES: Record<string, () => PatternImage> = {
  [CROP_PATTERN_IDS.soja]: stripesImage,
  [CROP_PATTERN_IDS.rice]: dotsImage,
};

/**
 * Draws a crop texture the moment a layer first asks for it. Set before any layer mounts
 * (the map's `ref`): adding them on `load` came after the parcels layer's first render,
 * and MapLibre warned for each missing image. Other ids stay missing.
 */
export function resolveCropPatterns(map: Map) {
  map.setMissingStyleImageResolver((id) => {
    const image = PATTERN_IMAGES[id];

    if (image && !map.hasImage(id)) map.addImage(id, image());
  });
}
