import type { MapLayerMouseEvent } from 'maplibre-gl';
import { useEffect, useEffectEvent } from 'react';
import { useMap } from 'react-map-gl/maplibre';

type LayerPointerHandlers = {
  onMove?: (event: MapLayerMouseEvent) => void;
  onLeave?: () => void;
  onClick?: (event: MapLayerMouseEvent) => void;
};

/**
 * Pointer events on one layer of the surrounding `<Map>`, with the pointer cursor over
 * it: what `interactiveLayerIds` does on the map's props, for layers injected as
 * children. `null` listens to nothing (a view where the layer is not interactive).
 */
export function useLayerPointer(
  layerId: string | null,
  { onMove, onLeave, onClick }: LayerPointerHandlers,
) {
  const { current: mapRef } = useMap();
  // Effect events: the latest handlers run without re-subscribing on every render.
  const move = useEffectEvent((event: MapLayerMouseEvent) => onMove?.(event));
  const leave = useEffectEvent(() => onLeave?.());
  const click = useEffectEvent((event: MapLayerMouseEvent) => onClick?.(event));

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map || layerId === null) return;

    const canvas = map.getCanvas();
    const over = (event: MapLayerMouseEvent) => {
      canvas.style.cursor = 'pointer';
      move(event);
    };
    const out = () => {
      canvas.style.cursor = '';
      leave();
    };
    const press = (event: MapLayerMouseEvent) => click(event);

    map.on('mousemove', layerId, over);
    map.on('mouseleave', layerId, out);
    map.on('click', layerId, press);

    return () => {
      map.off('mousemove', layerId, over);
      map.off('mouseleave', layerId, out);
      map.off('click', layerId, press);
      canvas.style.cursor = '';
    };
  }, [mapRef, layerId]);
}
