import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';

import { basemapVisibility, type CompositeBasemap } from '@/lib/map/composite-basemap';

/** Shows one of the composite style's two basemaps by toggling layer visibility. */
export function BasemapSwitch({
  basemap,
  showOverlay,
}: Readonly<{ basemap: CompositeBasemap; showOverlay: boolean }>) {
  const { current: mapRef } = useMap();

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;

    const apply = () => {
      for (const [id, visibility] of basemapVisibility(basemap, showOverlay)) {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visibility);
      }
    };

    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);

    return () => {
      map.off('load', apply);
    };
  }, [mapRef, basemap, showOverlay]);

  return null;
}
