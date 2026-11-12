import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import type { ExpressionSpecification } from 'maplibre-gl';
import { Layer, Source } from 'react-map-gl/maplibre';

import { ParcelNumbers } from '@/components/map/parcel-numbers';
import { parcelQueries } from '@/lib/api/parcels/queries';
import { CROP_PATTERN_IDS } from '@/lib/map/crop-patterns';
import { applyToggles, selectedParcelIds } from '@/lib/map/parcel-selection';
import { drawPolygonsAtom } from '@/store/draw';
import { toggledParcelIdsAtom } from '@/store/parcels';

/** Selected parcels in the analysis yellow of `draw-styles.ts`, the rest traced in white. */
const COLOR: ExpressionSpecification = ['case', ['get', 'selected'], '#F1FF28', '#FFFFFF'];
/** Yellow at half over the selection; a white veil on rice and unknown crops, none on soy. */
const FILL_OPACITY: ExpressionSpecification = [
  'case',
  ['get', 'selected'],
  0.5,
  ['==', ['get', 'crop'], 'soja'],
  0,
  0.1,
];
const PATTERN: ExpressionSpecification = [
  'match',
  ['get', 'crop'],
  'soja',
  CROP_PATTERN_IDS.soja,
  CROP_PATTERN_IDS.rice,
];
const PATTERN_OPACITY: ExpressionSpecification = ['case', ['get', 'selected'], 0.7, 0.5];

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
 * - `variant`: `analysis` adds a number chip over each parcel (`ParcelNumbers`).
 * - `zoom`: the camera's zoom, which the analysis chips need to know when they overlap.
 *   The mini map feeds it after each finished move; chips wait for it.
 */
export function FilteredParcelsLayer({
  parcelIds,
  highlightedIds,
  variant = 'default',
  zoom,
}: Readonly<{
  parcelIds?: string[];
  highlightedIds?: string[];
  variant?: 'default' | 'analysis';
  zoom?: number;
}>) {
  const isAnalysis = variant === 'analysis';
  const polygons = useAtomValue(drawPolygonsAtom);
  const toggled = useAtomValue(toggledParcelIdsAtom);
  const { data } = useQuery(parcelQueries.filtered(polygons));

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
      properties: {
        parcel_id: parcel.parcel_id,
        selected: parcel.selected,
        ...(parcel.last_crop_type && { crop: parcel.last_crop_type }),
      },
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
          id="filtered-parcels-pattern"
          type="fill"
          filter={['has', 'crop']}
          paint={{ 'fill-pattern': PATTERN, 'fill-opacity': PATTERN_OPACITY }}
        />
        <Layer
          id="filtered-parcels-fill"
          type="fill"
          paint={{ 'fill-color': COLOR, 'fill-opacity': FILL_OPACITY }}
        />
        <Layer
          id="filtered-parcels-outline"
          type="line"
          paint={{ 'line-color': COLOR, 'line-width': 2 }}
        />
      </Source>
      {isAnalysis && zoom !== undefined && (
        <ParcelNumbers parcels={parcels} parcelIds={numberedIds} zoom={zoom} />
      )}
    </>
  );
}
