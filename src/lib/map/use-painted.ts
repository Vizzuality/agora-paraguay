import { useEffect, useState } from 'react';
import { useMap } from 'react-map-gl/maplibre';

/**
 * True once the map has gone idle — every source parsed, every tile drawn — since `data`
 * last changed; false while `data` is undefined. An answer arriving is not the same as it
 * showing: a GeoJSON source is parsed in a worker and drawn a frame or more later.
 * Call from inside a react-map-gl `<Map>`.
 */
export function usePainted(data: unknown): boolean {
  const { current: mapRef } = useMap();
  const [painted, setPainted] = useState<unknown>(undefined);

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map || data === undefined) return;

    const done = () => setPainted(data);
    map.once('idle', done);
    // An answer that changes nothing on screen schedules no frame, so no idle: ask for one.
    map.triggerRepaint();

    return () => {
      map.off('idle', done);
    };
  }, [mapRef, data]);

  return data !== undefined && painted === data;
}
