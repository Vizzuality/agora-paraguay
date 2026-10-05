import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { Layer, Source } from 'react-map-gl/maplibre';

import { parcelQueries } from '@/lib/api/parcels/queries';
import { DOT_PATTERN_ID, useDotPattern } from '@/lib/map/use-dot-pattern';
import { drawPolygonsAtom } from '@/store/draw';

/**
 * The dot texture the design repeats inside every parcel. Terra Draw's adapter can
 * only paint hex + opacity (see `draw-styles.ts`), so the dots are a declarative
 * `fill-pattern` layer over all parcels — the per-parcel colors underneath stay
 * Terra Draw's job. Gone with the drawing once the parcels `filter-parcels` answers
 * have replaced it on the map (`FilteredParcelsLayer`).
 */
export function ParcelPattern() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const { data: parcels } = useQuery(parcelQueries.filtered(polygons));

  useDotPattern();

  if (polygons.length === 0 || (parcels?.results.length ?? 0) > 0) return null;

  return (
    <Source
      id="parcel-pattern"
      type="geojson"
      data={{ type: 'FeatureCollection', features: polygons }}
    >
      <Layer id="parcel-pattern-fill" type="fill" paint={{ 'fill-pattern': DOT_PATTERN_ID }} />
    </Source>
  );
}
