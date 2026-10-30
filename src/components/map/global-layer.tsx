import { Layer, Source } from 'react-map-gl/maplibre';

import {
  globalLayerSourceId,
  globalLayerStyles,
  type GlobalLayerStyleOptions,
} from '@/lib/map/global-layer-styles';
import { useGetGlobalLayer } from '@/lib/map/use-get-global-layer';

/** One of the API's global layers (`global_layer_vector`), painted by `globalLayerStyles`. */
export function GlobalLayer(props: Readonly<GlobalLayerStyleOptions>) {
  const data = useGetGlobalLayer(props.id);

  return (
    <Source id={globalLayerSourceId(props.id)} type="geojson" data={data}>
      {globalLayerStyles(props).map((style) => (
        <Layer key={style.id} {...style} />
      ))}
    </Source>
  );
}
