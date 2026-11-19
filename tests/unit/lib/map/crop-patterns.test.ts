import { describe, expect, it } from 'vitest';

import {
  CROP_PATTERN_IDS,
  dotsImage,
  resolveCropPatterns,
  stripesImage,
} from '@/lib/map/crop-patterns';

/** The tile as rows of `W` (mark) and `.` (transparent). */
function rows(image: { width: number; height: number; data: Uint8ClampedArray }) {
  return Array.from({ length: image.height }, (_, y) =>
    Array.from({ length: image.width }, (_, x) =>
      image.data[(y * image.width + x) * 4 + 3] === 255 ? 'W' : '.',
    ).join(''),
  );
}

describe('stripesImage', () => {
  it('draws 2px stripes every 5px, shifting one pixel left every two rows', () => {
    expect(rows(stripesImage()).slice(0, 5)).toEqual([
      '.WW...WW..',
      'WW...WW...',
      'WW...WW...',
      'W...WW...W',
      'W...WW...W',
    ]);
  });

  it('tiles seamlessly: the row after the last continues the first', () => {
    const tile = rows(stripesImage());

    expect(tile[9]).toBe(tile[0]);
  });
});

describe('dotsImage', () => {
  it('draws 2px dots on an 8px grid, every other row shifted by half', () => {
    expect(rows(dotsImage())).toEqual([
      'WW......',
      'WW......',
      '........',
      '........',
      '....WW..',
      '....WW..',
      '........',
      '........',
    ]);
  });

  it('paints marks opaque white, so the layer opacity alone sets their strength', () => {
    expect(Array.from(dotsImage().data.slice(0, 4))).toEqual([255, 255, 255, 255]);
  });
});

describe('resolveCropPatterns', () => {
  /** Just what the resolver touches of a MapLibre map. */
  function fakeMap() {
    const images = new Map<string, unknown>();
    let resolver: ((id: string) => void) | null = null;
    const map = {
      hasImage: (id: string) => images.has(id),
      addImage: (id: string, image: unknown) => images.set(id, image),
      setMissingStyleImageResolver: (next: (id: string) => void) => {
        resolver = next;
      },
    };

    return { map, images, resolve: (id: string) => resolver?.(id) };
  }

  it('draws a crop texture the first time a layer asks for it, once', () => {
    const { map, images, resolve } = fakeMap();
    resolveCropPatterns(map as unknown as Parameters<typeof resolveCropPatterns>[0]);

    resolve(CROP_PATTERN_IDS.soja);
    const stripes = images.get(CROP_PATTERN_IDS.soja);
    resolve(CROP_PATTERN_IDS.soja);
    resolve(CROP_PATTERN_IDS.rice);

    expect(stripes).toMatchObject({ width: 10, height: 10 });
    expect(images.get(CROP_PATTERN_IDS.soja)).toBe(stripes);
    expect(images.get(CROP_PATTERN_IDS.rice)).toMatchObject({ width: 8, height: 8 });
  });

  it('leaves any other missing image missing', () => {
    const { map, images, resolve } = fakeMap();
    resolveCropPatterns(map as unknown as Parameters<typeof resolveCropPatterns>[0]);

    resolve('some-basemap-icon');

    expect(images.size).toBe(0);
  });
});
