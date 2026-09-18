import { useQuery } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import type { ExpressionSpecification } from 'maplibre-gl';
import { useEffect } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';

import { parcelQueries } from '@/lib/api/parcels/queries';
import { applyToggles } from '@/lib/map/parcel-selection';
import { drawAtom, drawPolygonsAtom, setPolygonsHiddenAtom } from '@/store/draw';
import { toggledParcelIdsAtom } from '@/store/parcels';

/** Selected parcels in the analysis yellow of `draw-styles.ts`, the rest traced in white. */
const COLOR: ExpressionSpecification = ['case', ['get', 'selected'], '#F1FF28', '#FFFFFF'];
const FILL_OPACITY: ExpressionSpecification = ['case', ['get', 'selected'], 0.35, 0.05];
const LINE_WIDTH: ExpressionSpecification = ['case', ['get', 'selected'], 2, 1];

/**
 * The parcels `filter-parcels` answers for the polygons on the map, after the user's
 * clicks: the selected ones highlighted, the ones around them outlined. Plain MapLibre
 * layers, not Terra Draw features: they are reference data, so they stay out of the
 * draw store. Renders nothing until a drawing or upload exists and the query answers.
 *
 * Once parcels are on the map they stand in for the drawing, which is hidden (and
 * shown again while a new drawing waits for its parcels).
 */
export function FilteredParcelsLayer() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const toggled = useAtomValue(toggledParcelIdsAtom);
  const { bound } = useAtomValue(drawAtom);
  const setPolygonsHidden = useSetAtom(setPolygonsHiddenAtom);
  const { data } = useQuery(parcelQueries.filtered(polygons));

  const hasParcels = (data?.results.length ?? 0) > 0;

  // `bound` is a dependency so the flag is re-applied when Terra Draw comes back after
  // a visit to /analisis: it restores the polygons from the store, without the flag.
  useEffect(() => {
    if (bound) setPolygonsHidden(hasParcels);
  }, [bound, hasParcels, setPolygonsHidden]);

  if (!data) return null;

  // Every parcel's FeatureCollection flattened into one source, the flag and id set as
  // the feature properties so the paint expressions can read them.
  const features = applyToggles(data.results, toggled).flatMap((parcel) =>
    parcel.geometry.features.map((feature) => ({
      type: 'Feature' as const,
      geometry: feature.geometry,
      properties: { parcel_id: parcel.parcel_id, selected: parcel.selected },
    })),
  );

  if (features.length === 0) return null;

  return (
    <Source id="filtered-parcels" type="geojson" data={{ type: 'FeatureCollection', features }}>
      <Layer
        id="filtered-parcels-fill"
        type="fill"
        paint={{ 'fill-color': COLOR, 'fill-opacity': FILL_OPACITY }}
      />
      <Layer
        id="filtered-parcels-outline"
        type="line"
        paint={{ 'line-color': COLOR, 'line-width': LINE_WIDTH }}
      />
    </Source>
  );
}
