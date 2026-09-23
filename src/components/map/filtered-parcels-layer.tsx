import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import type { ExpressionSpecification } from 'maplibre-gl';
import { Layer, Source } from 'react-map-gl/maplibre';

import { parcelQueries } from '@/lib/api/parcels/queries';
import { applyToggles } from '@/lib/map/parcel-selection';
import { drawPolygonsAtom } from '@/store/draw';
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
 * A pure function of the query — hiding the drawing behind these parcels is
 * `useHideDrawingBehindParcels`, a Terra Draw side effect mounted from `DrawLayer`.
 * Shared by the main map and the hero mini map; the main map mounts it only once Terra
 * Draw is bound (see `MapView`), the mini map has no Terra Draw and mounts it outright.
 *
 * Which parcels paint yellow: the selection after the user's flips by default (the main
 * map), or exactly `highlightedIds` when given (the mini map passes the active tab's
 * parcel, so the hero shows one parcel at a time).
 */
export function FilteredParcelsLayer({ highlightedIds }: Readonly<{ highlightedIds?: string[] }>) {
  const polygons = useAtomValue(drawPolygonsAtom);
  const toggled = useAtomValue(toggledParcelIdsAtom);
  const { data } = useQuery(parcelQueries.filtered(polygons));

  if (!data) return null;

  const parcels =
    highlightedIds === undefined
      ? applyToggles(data.results, toggled)
      : data.results.map((parcel) => ({
          ...parcel,
          selected: highlightedIds.includes(parcel.parcel_id),
        }));

  // Every parcel's FeatureCollection flattened into one source, the flag and id set as
  // the feature properties so the paint expressions can read them.
  const features = parcels.flatMap((parcel) =>
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
