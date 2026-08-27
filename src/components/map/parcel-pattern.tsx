import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { Layer, Source, useMap } from 'react-map-gl/maplibre';

import { dotPatternImage } from '@/lib/map/draw-styles';
import { drawPolygonsAtom } from '@/store/draw';

const PATTERN_ID = 'parcel-dots';

/**
 * The dot texture the design repeats inside every parcel. Terra Draw's adapter can
 * only paint hex + opacity (see `draw-styles.ts`), so the dots are a declarative
 * `fill-pattern` layer over all parcels — the per-parcel colors underneath stay
 * Terra Draw's job.
 */
export function ParcelPattern() {
  const { current: mapRef } = useMap();
  const polygons = useAtomValue(drawPolygonsAtom);

  useEffect(() => {
    const map = mapRef?.getMap();

    if (!map) return;

    const addImage = () => {
      if (!map.hasImage(PATTERN_ID)) map.addImage(PATTERN_ID, dotPatternImage());
    };

    // Same dance as use-terra-draw: images can only join a loaded style.
    if (map.isStyleLoaded() || map.loaded()) addImage();
    else map.once('load', addImage);

    return () => {
      map.off('load', addImage);
    };
  }, [mapRef]);

  if (polygons.length === 0) return null;

  return (
    <Source
      id="parcel-pattern"
      type="geojson"
      data={{ type: 'FeatureCollection', features: polygons }}
    >
      <Layer id="parcel-pattern-fill" type="fill" paint={{ 'fill-pattern': PATTERN_ID }} />
    </Source>
  );
}
