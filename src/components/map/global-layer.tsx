import { useAtomValue } from 'jotai';
import type { GeoJSONSourceSpecification } from 'maplibre-gl';
import { Layer, Source } from 'react-map-gl/maplibre';

import { globalLayerVectorUrl } from '@/lib/api/layers/client';
import { activeGlobalLayerIdAtom } from '@/store/layers';

const EMPTY: GeoJSONSourceSpecification['data'] = { type: 'FeatureCollection', features: [] };

const COLOR = '#F97316';

/**
 * The global layer picked in the Capas list, drawn from its GeoJSON URL. Always mounted,
 * empty while none is picked: paint order is mount order, so it stays under the parcels
 * whenever it is switched on.
 */
export function GlobalLayer() {
  const id = useAtomValue(activeGlobalLayerIdAtom);

  return (
    <Source id="global-layer" type="geojson" data={id === null ? EMPTY : globalLayerVectorUrl(id)}>
      <Layer
        id="global-layer-fill"
        type="fill"
        paint={{ 'fill-color': COLOR, 'fill-opacity': 0.25 }}
      />
      <Layer id="global-layer-line" type="line" paint={{ 'line-color': COLOR, 'line-width': 1 }} />
    </Source>
  );
}
