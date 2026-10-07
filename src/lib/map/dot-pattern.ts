import type { Map } from 'maplibre-gl';

import { dotPatternImage } from '@/lib/map/draw-styles';

/** The style image id a `fill-pattern` layer names to paint the design's dot texture. */
export const DOT_PATTERN_ID = 'parcel-dots';

/**
 * Registers the dot texture with a map. Called from the map's `onLoad`, which fires once
 * the style is ready and before react-map-gl adds any `<Layer>`, so every
 * `fill-pattern: DOT_PATTERN_ID` layer finds its image. Idempotent.
 */
export function addDotPattern(map: Map) {
  if (!map.hasImage(DOT_PATTERN_ID)) map.addImage(DOT_PATTERN_ID, dotPatternImage());
}
