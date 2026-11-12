import type { GeoJSONStoreFeatures } from 'terra-draw';
import { describe, expect, it } from 'vitest';

import { PARCEL_STYLES } from '@/lib/map/draw-styles';

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

  it('paints hand-drawn parcels yellow like the selection, never Terra Draw blue', () => {
    const drawn = parcel('d');

    expect(PARCEL_STYLES.fillColor(drawn)).toBe('#F1FF28');
    expect(PARCEL_STYLES.fillOpacity(drawn)).toBe(0.5);
    expect(PARCEL_STYLES.outlineColor(drawn)).toBe('#F1FF28');
    expect(PARCEL_STYLES.outlineWidth(drawn)).toBe(2);
  });

  it('paints a hidden parcel fully transparent, whatever else it is', () => {
    const hidden = parcel('h', { origin: 'upload', analysis: true, hidden: true });

    expect(PARCEL_STYLES.fillOpacity(hidden)).toBe(0);
    expect(PARCEL_STYLES.outlineWidth(hidden)).toBe(0);
  });

  it('paints the drawing handles yellow with a white outline', () => {
    expect(PARCEL_STYLES.closingPointColor).toBe('#F1FF28');
    expect(PARCEL_STYLES.coordinatePointColor).toBe('#F1FF28');
    expect(PARCEL_STYLES.editedPointColor).toBe('#F1FF28');
    expect(PARCEL_STYLES.snappingPointColor).toBe('#F1FF28');
    expect(PARCEL_STYLES.closingPointOutlineColor).toBe('#FFFFFF');
  });

  it('requires the analysis flag to be literally true to lift an upload out of white', () => {
    expect(PARCEL_STYLES.fillColor(parcel('a', { origin: 'upload', analysis: false }))).toBe(
      '#FFFFFF',
    );
    expect(PARCEL_STYLES.fillColor(parcel('a', { origin: 'upload', analysis: 'yes' }))).toBe(
      '#FFFFFF',
    );
  });
});
