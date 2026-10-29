import type { ExpressionSpecification } from 'maplibre-gl';
import { Layer, Source } from 'react-map-gl/maplibre';

import { DISTRICT_KEY_EXPRESSION } from '@/lib/map/exposure-districts';
import { useGetGlobalLayer } from '@/lib/map/use-get-global-layer';

/** The source's id, for `querySourceFeatures`. */
export function globalLayerSourceId(id: number): string {
  return `global-layer-${id}`;
}

/** The fill layer's id, for `interactiveLayerIds`: the map reports features under it. */
export function globalLayerFillId(id: number): string {
  return `global-layer-${id}-fill`;
}

type GlobalLayerProps = {
  id: number;
  /** One colour, or an expression that picks one per feature. */
  color: string | ExpressionSpecification;
  /** Paint only this district's features, plus any that belong to no district. */
  districtId?: string | null;
  /** Fill this district a step stronger and trace it thicker, on top of its neighbours. */
  highlightedId?: string | null;
};

/**
 * One of the API's global layers (`global_layer_vector`) in a single colour. Areas
 * fill, lines and points trace, so any geometry the layer holds shows.
 */
export function GlobalLayer({ id, color, districtId, highlightedId }: Readonly<GlobalLayerProps>) {
  const data = useGetGlobalLayer(id);
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

  return (
    <Source id={source} type="geojson" data={data}>
      <Layer
        id={globalLayerFillId(id)}
        type="fill"
        filter={inDistrict(['==', ['geometry-type'], 'Polygon'])}
        paint={{
          'fill-color': color,
          'fill-opacity': ['case', isHighlighted, 0.85, 0.7],
        }}
      />
      <Layer
        id={`${source}-line`}
        type="line"
        filter={inDistrict(['!=', ['geometry-type'], 'Point'])}
        // The picked district's outline draws last, so its neighbours never cover it.
        layout={{ 'line-sort-key': ['case', isHighlighted, 1, 0] }}
        paint={{
          'line-color': color,
          'line-width': ['case', isHighlighted, 2.5, 1.5],
        }}
      />
      <Layer
        id={`${source}-point`}
        type="circle"
        filter={inDistrict(['==', ['geometry-type'], 'Point'])}
        paint={{ 'circle-color': color, 'circle-radius': 3 }}
      />
    </Source>
  );
}
