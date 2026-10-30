import { describe, expect, it } from 'vitest';

import { DISTRICT_KEY_EXPRESSION } from '@/lib/map/exposure-districts';
import { globalLayerFillId, globalLayerStyles } from '@/lib/map/global-layer-styles';

describe('globalLayerStyles', () => {
  it('fills, traces and dots, the fill under the id the map reports clicks on', () => {
    const styles = globalLayerStyles({ id: 9, color: '#000' });

    expect(styles.map((style) => [style.id, style.type])).toEqual([
      [globalLayerFillId(9), 'fill'],
      ['global-layer-9-line', 'line'],
      ['global-layer-9-point', 'circle'],
    ]);
  });

  it('filters by geometry alone with no district picked', () => {
    const [fill] = globalLayerStyles({ id: 8, color: '#000' });

    expect(fill.filter).toEqual(['==', ['geometry-type'], 'Polygon']);
  });

  it("keeps the picked district's features and those of no district", () => {
    const [fill] = globalLayerStyles({ id: 8, color: '#000', districtId: '0101' });

    expect(fill.filter).toEqual([
      'all',
      ['==', ['geometry-type'], 'Polygon'],
      ['any', ['==', DISTRICT_KEY_EXPRESSION, ''], ['==', DISTRICT_KEY_EXPRESSION, '0101']],
    ]);
  });

  it('draws the highlighted district stronger and thicker', () => {
    const [fill, line] = globalLayerStyles({ id: 9, color: '#000', highlightedId: '0101' });
    const isHighlighted = ['==', DISTRICT_KEY_EXPRESSION, '0101'];

    expect(fill.paint).toMatchObject({ 'fill-opacity': ['case', isHighlighted, 0.85, 0.7] });
    expect(line.paint).toMatchObject({ 'line-width': ['case', isHighlighted, 2.5, 1.5] });
  });
});
