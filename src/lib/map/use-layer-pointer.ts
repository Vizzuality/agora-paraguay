import type { MapLayerMouseEvent } from 'maplibre-gl';
import { useEffect, useEffectEvent } from 'react';
import { useMap } from 'react-map-gl/maplibre';

type LayerPointerHandlers = {
  onMove?: (event: MapLayerMouseEvent) => void;
  onLeave?: () => void;
  onClick?: (event: MapLayerMouseEvent) => void;
};

/**
 * Pointer events on layers of the surrounding `<Map>`, with the pointer cursor over
 * them: what `interactiveLayerIds` does on the map's props, for layers injected as
 * children. Several ids act as one. `null` listens to nothing (a view where no layer is
 * interactive). Pass a stable array, or the listeners re-subscribe every render.
 */
export function useLayerPointer(
  layerId: string | string[] | null,
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
    // MapLibre's overloads take one id or an array, not the union.
    const layerIds = [layerId].flat();

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

    map.on('mousemove', layerIds, over);
    map.on('mouseleave', layerIds, out);
    map.on('click', layerIds, press);

    return () => {
      map.off('mousemove', layerIds, over);
      map.off('mouseleave', layerIds, out);
      map.off('click', layerIds, press);
      canvas.style.cursor = '';
    };
  }, [mapRef, layerId]);
}
