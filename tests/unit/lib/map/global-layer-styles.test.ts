import { describe, expect, it } from 'vitest';

import { GLOBAL_LAYER_SOURCE_LAYER } from '@/lib/api/layers/queries';
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

  it('traces only the highlighted district in outline mode, over a clickable clear fill', () => {
    const styles = globalLayerStyles({
      id: 9,
      color: '#fff',
      highlightedId: '0101',
      outline: true,
    });
    const [fill, line] = styles;

    expect(styles.map((style) => style.type)).toEqual(['fill', 'line']);
    expect(fill.id).toBe(globalLayerFillId(9));
    expect(fill.paint).toMatchObject({ 'fill-opacity': 0 });
    expect(line.filter).toEqual([
      'all',
      ['!=', ['geometry-type'], 'Point'],
      ['==', DISTRICT_KEY_EXPRESSION, '0101'],
    ]);
  });

  it("paints a layer's own fill alone, keeping the district filter", () => {
    const fill = { color: '#6d8067', opacity: 0.9, outlineColor: '#000' };
    const styles = globalLayerStyles({ id: 8, color: '#000', fill, districtId: '0101' });

    expect(styles.map((style) => style.type)).toEqual(['fill']);
    expect(styles[0].paint).toEqual({
      'fill-color': '#6d8067',
      'fill-opacity': 0.9,
      'fill-outline-color': '#000',
    });
    expect(styles[0].filter).toEqual([
      'all',
      ['==', ['geometry-type'], 'Polygon'],
      ['any', ['==', DISTRICT_KEY_EXPRESSION, ''], ['==', DISTRICT_KEY_EXPRESSION, '0101']],
    ]);
  });

  it("keeps the pick's outline over a layer's own fill in outline mode", () => {
    const fill = { color: 'rgba(0, 0, 0, 0)', opacity: 1, outlineColor: 'rgba(0, 0, 0, 0.2)' };
    const [fillLayer, line] = globalLayerStyles({
      id: 9,
      color: '#fff',
      fill,
      outline: true,
      highlightedId: '0101',
    });

    expect(fillLayer.paint).toMatchObject({ 'fill-outline-color': 'rgba(0, 0, 0, 0.2)' });
    expect(line.paint).toMatchObject({ 'line-color': '#fff' });
    expect(line.filter).toEqual([
      'all',
      ['!=', ['geometry-type'], 'Point'],
      ['==', DISTRICT_KEY_EXPRESSION, '0101'],
    ]);
  });

  it("traces a layer's own fill in `color` when given a line width, the pick thicker", () => {
    const fill = { color: '#e06900', opacity: 0.6, outlineColor: 'rgba(0, 0, 0, 0)' };
    const styles = globalLayerStyles({
      id: 9,
      color: '#ff871f',
      fill,
      lineWidth: 2,
      highlightedId: '0101',
    });
    const isHighlighted = ['==', DISTRICT_KEY_EXPRESSION, '0101'];

    expect(styles.map((style) => style.type)).toEqual(['fill', 'line']);
    expect(styles[0].paint).toMatchObject({ 'fill-color': '#e06900', 'fill-opacity': 0.6 });
    expect(styles[1].paint).toEqual({
      'line-color': '#ff871f',
      'line-width': ['case', isHighlighted, 3, 2],
    });
  });

  it('hides every layer when hidden, so the source stays loaded', () => {
    const shown = globalLayerStyles({ id: 8, color: '#000' });
    const hidden = globalLayerStyles({ id: 8, color: '#000', hidden: true });
    const outline = globalLayerStyles({ id: 9, color: '#fff', outline: true, hidden: true });

    expect(shown.map((style) => style.layout?.visibility)).toEqual([
      'visible',
      'visible',
      'visible',
    ]);
    expect([...hidden, ...outline].every((style) => style.layout?.visibility === 'none')).toBe(
      true,
    );
  });

  it("reads the tiles' layer on every style, outline mode included", () => {
    const styles = [
      ...globalLayerStyles({ id: 8, color: '#000' }),
      ...globalLayerStyles({ id: 9, color: '#fff', outline: true }),
    ];

    expect(styles.map((style) => style['source-layer'])).toEqual(
      styles.map(() => GLOBAL_LAYER_SOURCE_LAYER),
    );
  });
});
