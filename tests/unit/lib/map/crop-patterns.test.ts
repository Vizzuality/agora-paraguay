import { describe, expect, it } from 'vitest';

import { dotsImage, stripesImage } from '@/lib/map/crop-patterns';

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
