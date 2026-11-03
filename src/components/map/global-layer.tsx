import { Layer, Source } from 'react-map-gl/maplibre';

import { GLOBAL_LAYER_MAX_ZOOM } from '@/lib/api/layers/queries';
import {
  globalLayerSourceId,
  globalLayerStyles,
  type GlobalLayerStyleOptions,
} from '@/lib/map/global-layer-styles';
import { useGetGlobalLayer } from '@/lib/map/use-get-global-layer';

/**
 * One of the API's global layers as vector tiles (`global_layer_tiles`), painted by
 * `globalLayerStyles`.
 * `beforeId` slots its layers under one of ours that is mounted first; never a basemap id,
 * which a remote style may lack (a missing id drops the layer).
 */
export function GlobalLayer({
  beforeId,
  ...props
}: Readonly<GlobalLayerStyleOptions & { beforeId?: string }>) {
  const tiles = useGetGlobalLayer(props.id);

  return (
    <Source
      id={globalLayerSourceId(props.id)}
      type="vector"
      tiles={[tiles]}
      maxzoom={GLOBAL_LAYER_MAX_ZOOM}
    >
      {globalLayerStyles(props).map((style) => (
        <Layer key={style.id} {...style} beforeId={beforeId} />
      ))}
    </Source>
  );
}
