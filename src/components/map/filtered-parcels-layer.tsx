import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import type { ExpressionSpecification } from 'maplibre-gl';
import { Layer, Source } from 'react-map-gl/maplibre';

import { parcelQueries } from '@/lib/api/parcels/queries';
import { applyToggles, highlightParcels } from '@/lib/map/parcel-selection';
import { drawPolygonsAtom } from '@/store/draw';
import { toggledParcelIdsAtom } from '@/store/parcels';

/** Selected parcels in the analysis yellow of `draw-styles.ts`, the rest traced in white. */
const COLOR: ExpressionSpecification = ['case', ['get', 'selected'], '#F1FF28', '#FFFFFF'];
const FILL_OPACITY: ExpressionSpecification = ['case', ['get', 'selected'], 0.35, 0.05];
const LINE_WIDTH: ExpressionSpecification = ['case', ['get', 'selected'], 2, 1];

/**
 * The parcels `filter-parcels` answers for the polygons on the map: the highlighted ones
 * in yellow, the ones around them outlined. On the main map the highlight is the
 * selection after the user's clicks; the hero mini map passes `highlightedIds` instead —
 * the active tab's parcel, or every submitted one under Todas. Plain MapLibre layers, not
 * Terra Draw features: they are reference data, so they stay out of the draw store.
 * Renders nothing until a drawing or upload exists and the query answers. A pure
 * function of the query — hiding the drawing behind these parcels is
 * `useHideDrawingBehindParcels`, a Terra Draw side effect mounted from `DrawLayer`.
 * The main map mounts it only once Terra Draw is bound (see `MapView`), the mini map has
 * no Terra Draw and mounts it outright.
 */
export function FilteredParcelsLayer({
  highlightedIds,
}: Readonly<{ highlightedIds?: string[] }> = {}) {
  const polygons = useAtomValue(drawPolygonsAtom);
  const toggled = useAtomValue(toggledParcelIdsAtom);
  const { data } = useQuery(parcelQueries.filtered(polygons));

  if (!data) return null;

  const painted = highlightedIds
    ? highlightParcels(data.results, highlightedIds)
    : applyToggles(data.results, toggled);

  // Every parcel's FeatureCollection flattened into one source, the flag and id set as
  // the feature properties so the paint expressions can read them.
  const features = painted.flatMap((parcel) =>
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
