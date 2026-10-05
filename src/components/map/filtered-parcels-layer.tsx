import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import type { ExpressionSpecification } from 'maplibre-gl';
import { Layer, Source } from 'react-map-gl/maplibre';

import { ParcelNumbers } from '@/components/map/parcel-numbers';
import { parcelQueries } from '@/lib/api/parcels/queries';
import { applyToggles, selectedParcelIds } from '@/lib/map/parcel-selection';
import { DOT_PATTERN_ID, useDotPattern } from '@/lib/map/use-dot-pattern';
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
 * Two optional filters, both defaulting to the main map's behaviour:
 * - `parcelIds`: which parcels paint. Default: every one the API answered. The mini map
 *   passes the analysed ids, so unselected neighbours do not follow into the hero.
 * - `highlightedIds`: which of those paint yellow. Default: the selection after the
 *   user's flips. The mini map passes the open tab's parcel.
 * - `numbered`: whether each parcel wears its "Parcela N" number (`ParcelNumbers`). The
 *   mini map does; the main map, where the parcels are still being picked, does not.
 * - `dotted`: whether every shown parcel carries the design's dot texture over its fill
 *   (Figma 5538:6934). The mini map does.
 */
export function FilteredParcelsLayer({
  parcelIds,
  highlightedIds,
  numbered = false,
  dotted = false,
}: Readonly<{
  parcelIds?: string[];
  highlightedIds?: string[];
  numbered?: boolean;
  dotted?: boolean;
}>) {
  const polygons = useAtomValue(drawPolygonsAtom);
  const toggled = useAtomValue(toggledParcelIdsAtom);
  const { data } = useQuery(parcelQueries.filtered(polygons));

  useDotPattern();

  if (!data) return null;

  const shown =
    parcelIds === undefined
      ? data.results
      : data.results.filter((parcel) => parcelIds.includes(parcel.parcel_id));
  const parcels =
    highlightedIds === undefined
      ? applyToggles(shown, toggled)
      : shown.map((parcel) => ({
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

  // The order that gives the numbers: the analysed list on the mini map, else the
  // selection as Analizar will submit it (`ConfirmActions`), so N matches the hero tab.
  const numberedIds = parcelIds ?? selectedParcelIds(parcels);

  return (
    <>
      <Source id="filtered-parcels" type="geojson" data={{ type: 'FeatureCollection', features }}>
        <Layer
          id="filtered-parcels-fill"
          type="fill"
          paint={{ 'fill-color': COLOR, 'fill-opacity': FILL_OPACITY }}
        />
        {dotted && (
          <Layer
            id="filtered-parcels-dots"
            type="fill"
            paint={{ 'fill-pattern': DOT_PATTERN_ID }}
          />
        )}
        <Layer
          id="filtered-parcels-outline"
          type="line"
          paint={{ 'line-color': COLOR, 'line-width': LINE_WIDTH }}
        />
      </Source>
      {numbered && <ParcelNumbers parcels={parcels} parcelIds={numberedIds} />}
    </>
  );
}
