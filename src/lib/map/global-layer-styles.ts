import type {
  CircleLayerSpecification,
  ExpressionSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
} from 'maplibre-gl';

import { DISTRICT_KEY_EXPRESSION } from '@/lib/map/exposure-districts';

/** A layer spec without its source: the `<Source>` it renders under supplies it. */
export type GlobalLayerStyle =
  | Omit<FillLayerSpecification, 'source'>
  | Omit<LineLayerSpecification, 'source'>
  | Omit<CircleLayerSpecification, 'source'>;

export type GlobalLayerStyleOptions = {
  id: number;
  /** One colour, or an expression that picks one per feature. */
  color: string | ExpressionSpecification;
  /** Paint only this district's features, plus any that belong to no district. */
  districtId?: string | null;
  /** Fill this district a step stronger and trace it thicker, on top of its neighbours. */
  highlightedId?: string | null;
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
  districtId,
  highlightedId,
}: GlobalLayerStyleOptions): GlobalLayerStyle[] {
  const source = globalLayerSourceId(id);

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

  return [
    {
      id: globalLayerFillId(id),
      type: 'fill',
      filter: inDistrict(['==', ['geometry-type'], 'Polygon']),
      paint: {
        'fill-color': color,
        'fill-opacity': ['case', isHighlighted, 0.85, 0.7],
      },
    },
    {
      id: `${source}-line`,
      type: 'line',
      filter: inDistrict(['!=', ['geometry-type'], 'Point']),
      // The picked district's outline draws last, so its neighbours never cover it.
      layout: { 'line-sort-key': ['case', isHighlighted, 1, 0] },
      paint: {
        'line-color': color,
        'line-width': ['case', isHighlighted, 2.5, 1.5],
      },
    },
    {
      id: `${source}-point`,
      type: 'circle',
      filter: inDistrict(['==', ['geometry-type'], 'Point']),
      paint: { 'circle-color': color, 'circle-radius': 3 },
    },
  ];
}
