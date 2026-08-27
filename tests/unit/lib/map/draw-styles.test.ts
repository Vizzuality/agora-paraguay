import type { GeoJSONStoreFeatures } from 'terra-draw';
import { describe, expect, it } from 'vitest';

import { dotPatternImage, PARCEL_STYLES } from '@/lib/map/draw-styles';

function parcel(id: string, properties: Record<string, unknown> = {}): GeoJSONStoreFeatures {
  return {
    id,
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-58, -24],
          [-58, -23.9],
          [-57.9, -23.9],
          [-58, -24],
        ],
      ],
    },
    properties: { mode: 'polygon', ...properties },
  } as GeoJSONStoreFeatures;
}

describe('PARCEL_STYLES', () => {
  it('paints the analysis selection yellow, whatever its origin', () => {
    const selected = parcel('a', { origin: 'upload', analysis: true });

    expect(PARCEL_STYLES.fillColor(selected)).toBe('#F1FF28');
    expect(PARCEL_STYLES.fillOpacity(selected)).toBe(0.5);
    expect(PARCEL_STYLES.outlineColor(selected)).toBe('#F1FF28');
    expect(PARCEL_STYLES.outlineWidth(selected)).toBe(2);
  });

  it('paints uploaded parcels white', () => {
    const uploaded = parcel('u', { origin: 'upload' });

    expect(PARCEL_STYLES.fillColor(uploaded)).toBe('#FFFFFF');
    expect(PARCEL_STYLES.fillOpacity(uploaded)).toBe(0.1);
    expect(PARCEL_STYLES.outlineColor(uploaded)).toBe('#FFFFFF');
    expect(PARCEL_STYLES.outlineWidth(uploaded)).toBe(2);
  });

  it('leaves hand-drawn parcels on Terra Draw defaults', () => {
    const drawn = parcel('d');

    expect(PARCEL_STYLES.fillColor(drawn)).toBeUndefined();
    expect(PARCEL_STYLES.fillOpacity(drawn)).toBeUndefined();
    expect(PARCEL_STYLES.outlineColor(drawn)).toBeUndefined();
    expect(PARCEL_STYLES.outlineWidth(drawn)).toBeUndefined();
  });

  it('requires the analysis flag to be literally true, not merely set', () => {
    expect(PARCEL_STYLES.fillColor(parcel('a', { analysis: false }))).toBeUndefined();
    expect(PARCEL_STYLES.fillColor(parcel('a', { analysis: 'yes' }))).toBeUndefined();
  });
});

describe('dotPatternImage', () => {
  it('produces an RGBA tile of the requested size', () => {
    const image = dotPatternImage(50);

    expect(image.width).toBe(50);
    expect(image.height).toBe(50);
    expect(image.data).toHaveLength(50 * 50 * 4);
  });

  it('draws one dot at the tile center — an axis-aligned square grid', () => {
    const image = dotPatternImage(50, 2, 178);
    const at = (x: number, y: number) => (y * 50 + x) * 4 + 3;

    expect(image.data[at(25, 25)]).toBe(178);
    // No corner dots: those turned the repeat into a 45°-rotated (diamond) lattice.
    expect(image.data[at(0, 0)]).toBe(0);
    expect(image.data[at(25, 0)]).toBe(0);
  });

  it('draws the dot as a square, not a disc that rasterises into a diamond', () => {
    const image = dotPatternImage(50, 2, 178);
    const at = (x: number, y: number) => (y * 50 + x) * 4 + 3;

    // The 4×4 square spans 23..26 — a Euclidean disc would clip these corners.
    expect(image.data[at(23, 23)]).toBe(178);
    expect(image.data[at(26, 26)]).toBe(178);
    // One past the square in every direction is empty.
    expect(image.data[at(22, 23)]).toBe(0);
    expect(image.data[at(27, 26)]).toBe(0);
  });
});
