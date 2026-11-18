import type {
  CircleLayerSpecification,
  ExpressionSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
} from 'maplibre-gl';

import { GLOBAL_LAYER_SOURCE_LAYER } from '@/lib/api/layers/queries';
import { DISTRICT_KEY_EXPRESSION } from '@/lib/map/exposure-districts';

/**
 * A layer spec without its source: the `<Source>` it renders under supplies it. Every
 * layer reads the tiles' one layer, `GLOBAL_LAYER_SOURCE_LAYER`.
 */
export type GlobalLayerStyle =
  | Omit<FillLayerSpecification, 'source'>
  | Omit<LineLayerSpecification, 'source'>
  | Omit<CircleLayerSpecification, 'source'>;

type Color = string | ExpressionSpecification;

/** A layer's own fill look: its areas only, edged by the fill's 1px outline. */
export type FillPaint = {
  color: Color;
  /** One opacity, or an expression that picks one per feature. */
  opacity: number | ExpressionSpecification;
  outlineColor: string;
};

export type GlobalLayerStyleOptions = {
  id: number;
  /** One colour, or an expression that picks one per feature. */
  color: Color;
  /**
   * Replaces the default fill with the layer's own look. Without `outline` the layer is
   * that fill alone, no lines or points, unless `lineWidth` traces it too.
   */
  fill?: FillPaint;
  /** With `fill`: also trace every feature in `color` this wide, the highlighted one thicker. */
  lineWidth?: number;
  /**
   * With `fill` and a `highlightedId`: the share of their opacity (0–1) every other
   * feature keeps, fill and trace, so the pick stands out in its own colours.
   */
  othersOpacity?: number;
  /** Paint only this district's features, plus any that belong to no district. */
  districtId?: string | null;
  /** Fill this district a step stronger and trace it thicker, on top of its neighbours. */
  highlightedId?: string | null;
  /**
   * Trace only the highlighted (3px) and hovered (2px) districts, in `color`; the fill
   * stays transparent but still reports clicks. How Capas shows the pick over the
   * reference layers.
   */
  outline?: boolean;
  /** With `outline`: the district under the pointer. */
  hoveredId?: string | null;
  /** With `outline` and `fill`: the hovered district's fill. */
  hoverFill?: string;
  /** Hide the layer without removing its source, so showing it again needs no reload. */
  hidden?: boolean;
};

/** The source's id, for `querySourceFeatures`. */
export function globalLayerSourceId(id: number): string {
  return `global-layer-${id}`;
}

/** The fill layer's id, for `interactiveLayerIds`: the map reports features under it. */
export function globalLayerFillId(id: number): string {
  return `global-layer-${id}-fill`;
}

/**
 * The layers one global layer paints, in paint order: areas fill, lines and outlines
 * trace, points dot, so any geometry the layer holds shows.
 */
export function globalLayerStyles({
  id,
  color,
  fill,
  lineWidth,
  othersOpacity,
  districtId,
  highlightedId,
  outline = false,
  hoveredId,
  hoverFill,
  hidden = false,
}: GlobalLayerStyleOptions): GlobalLayerStyle[] {
  const source = globalLayerSourceId(id);
  const visibility = hidden ? 'none' : 'visible';

  const inDistrict = (geometry: ExpressionSpecification): ExpressionSpecification =>
    districtId
      ? [
          'all',
          geometry,
          // Features without a district (a hazard layer's) are not the pick's to hide.
          ['any', ['==', DISTRICT_KEY_EXPRESSION, ''], ['==', DISTRICT_KEY_EXPRESSION, districtId]],
        ]
      : geometry;

  const isHighlighted: ExpressionSpecification = [
    '==',
    DISTRICT_KEY_EXPRESSION,
    highlightedId ?? '',
  ];

  if (outline) {
    return outlineStyles({ id, color, fill, hoveredId, hoverFill, isHighlighted, visibility });
  }

  if (fill) {
    // The others fade only while something is picked; with nothing picked all paint alike.
    const share = highlightedId ? othersOpacity : undefined;
    const fillLayer: GlobalLayerStyle = {
      id: globalLayerFillId(id),
      type: 'fill',
      'source-layer': GLOBAL_LAYER_SOURCE_LAYER,
      filter: inDistrict(['==', ['geometry-type'], 'Polygon']),
      layout: { visibility },
      paint: fillPaint(
        share === undefined
          ? fill
          : { ...fill, opacity: ['case', isHighlighted, fill.opacity, ['*', fill.opacity, share]] },
      ),
    };

    if (lineWidth === undefined) return [fillLayer];

    return [
      fillLayer,
      {
        id: `${source}-line`,
        type: 'line',
        'source-layer': GLOBAL_LAYER_SOURCE_LAYER,
        filter: inDistrict(['!=', ['geometry-type'], 'Point']),
        layout: { visibility, 'line-sort-key': ['case', isHighlighted, 1, 0] },
        paint: {
          'line-color': color,
          'line-width': ['case', isHighlighted, lineWidth + 1, lineWidth],
          ...(share === undefined ? {} : { 'line-opacity': ['case', isHighlighted, 1, share] }),
        },
      },
    ];
  }

  return [
    {
      id: globalLayerFillId(id),
      type: 'fill',
      'source-layer': GLOBAL_LAYER_SOURCE_LAYER,
      filter: inDistrict(['==', ['geometry-type'], 'Polygon']),
      layout: { visibility },
      paint: {
        'fill-color': color,
        'fill-opacity': ['case', isHighlighted, 0.85, 0.7],
      },
    },
    {
      id: `${source}-line`,
      type: 'line',
      'source-layer': GLOBAL_LAYER_SOURCE_LAYER,
      filter: inDistrict(['!=', ['geometry-type'], 'Point']),
      // The picked district's outline draws last, so its neighbours never cover it.
      layout: { visibility, 'line-sort-key': ['case', isHighlighted, 1, 0] },
      paint: {
        'line-color': color,
        'line-width': ['case', isHighlighted, 2.5, 1.5],
      },
    },
    {
      id: `${source}-point`,
      type: 'circle',
      'source-layer': GLOBAL_LAYER_SOURCE_LAYER,
      filter: inDistrict(['==', ['geometry-type'], 'Point']),
      layout: { visibility },
      paint: { 'circle-color': color, 'circle-radius': 3 },
    },
  ];
}

/**
 * Outline mode: a clear fill that still reports clicks, darkened under the pointer, and a
 * trace of the highlighted (3px) and hovered (2px) districts only.
 */
function outlineStyles({
  id,
  color,
  fill,
  hoveredId,
  hoverFill,
  isHighlighted,
  visibility,
}: Pick<GlobalLayerStyleOptions, 'id' | 'color' | 'fill' | 'hoveredId' | 'hoverFill'> & {
  isHighlighted: ExpressionSpecification;
  visibility: 'visible' | 'none';
}): GlobalLayerStyle[] {
  const source = globalLayerSourceId(id);
  const isHovered: ExpressionSpecification = ['==', DISTRICT_KEY_EXPRESSION, hoveredId ?? ''];
  const outlineFill =
    fill && hoverFill
      ? { ...fill, color: ['case', isHovered, hoverFill, fill.color] as ExpressionSpecification }
      : fill;

  return [
    {
      id: globalLayerFillId(id),
      type: 'fill',
      'source-layer': GLOBAL_LAYER_SOURCE_LAYER,
      filter: ['==', ['geometry-type'], 'Polygon'],
      layout: { visibility },
      paint: outlineFill ? fillPaint(outlineFill) : { 'fill-color': color, 'fill-opacity': 0 },
    },
    {
      id: `${source}-line`,
      type: 'line',
      'source-layer': GLOBAL_LAYER_SOURCE_LAYER,
      filter: ['all', ['!=', ['geometry-type'], 'Point'], ['any', isHighlighted, isHovered]],
      // The selection draws last, over a hovered neighbour's shared edge.
      layout: { visibility, 'line-sort-key': ['case', isHighlighted, 1, 0] },
      paint: { 'line-color': color, 'line-width': ['case', isHighlighted, 3, 2] },
    },
  ];
}

function fillPaint({ color, opacity, outlineColor }: FillPaint): FillLayerSpecification['paint'] {
  return { 'fill-color': color, 'fill-opacity': opacity, 'fill-outline-color': outlineColor };
}
