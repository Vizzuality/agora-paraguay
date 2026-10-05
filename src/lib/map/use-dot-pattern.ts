import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';

import { dotPatternImage } from '@/lib/map/draw-styles';

/** The style image id a `fill-pattern` layer names to paint the design's dot texture. */
export const DOT_PATTERN_ID = 'parcel-dots';

/**
 * Registers the dot texture with the enclosing map so `fill-pattern: DOT_PATTERN_ID`
 * layers can paint it. Images can only join a loaded style, so it waits for `load`
 * when needed (same dance as `use-terra-draw`). Idempotent per map. Runs inside `<Map>`.
 */
export function useDotPattern() {
  const { current: mapRef } = useMap();

  useEffect(() => {
    const map = mapRef?.getMap();

    if (!map) return;

    const addImage = () => {
      if (!map.hasImage(DOT_PATTERN_ID)) map.addImage(DOT_PATTERN_ID, dotPatternImage());
    };

    if (map.isStyleLoaded() || map.loaded()) addImage();
    else map.once('load', addImage);

    return () => {
      map.off('load', addImage);
    };
  }, [mapRef]);
}
