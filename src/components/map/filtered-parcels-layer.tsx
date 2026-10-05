import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import type { ExpressionSpecification } from 'maplibre-gl';
import { Layer, Marker, Source } from 'react-map-gl/maplibre';

import { parcelNumber } from '@/lib/analysis/parcel-label';
import { parcelQueries } from '@/lib/api/parcels/queries';
import type { FilteredParcel } from '@/lib/api/parcels/schemas';
import { labelAnchor } from '@/lib/map/label-anchor';
import { applyToggles, selectedParcelIds } from '@/lib/map/parcel-selection';
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
 */
export function FilteredParcelsLayer({
  parcelIds,
  highlightedIds,
}: Readonly<{ parcelIds?: string[]; highlightedIds?: string[] }>) {
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
      properties: { parcel_id: parcel.parcel_id, selected: parcel.selected },
    })),
  );

  if (features.length === 0) return null;

  // The parcels that carry a number, in the order that gives it: the analysed list on
  // the mini map, else the selection as Analizar will submit it (`ConfirmActions`), so
  // the number on the map is the "Parcela N" its hero tab will carry.
  const numbered = parcelIds ?? selectedParcelIds(parcels);

  return (
    <>
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
      {parcels.map((parcel) => (
        <ParcelNumber key={parcel.parcel_id} parcel={parcel} parcelIds={numbered} />
      ))}
    </>
  );
}

/**
 * The parcel's number on the map, over its centroid. A DOM marker rather than a symbol
 * layer: the satellite style has no glyphs, so MapLibre could not draw text. Lets clicks
 * through to the parcel underneath. Nothing for a parcel outside the numbered list.
 */
function ParcelNumber({
  parcel,
  parcelIds,
}: Readonly<{ parcel: FilteredParcel; parcelIds: string[] }>) {
  const number = parcelNumber(parcel.parcel_id, parcelIds);

  if (number === null) return null;

  const anchor = labelAnchor(parcel.geometry.features.map((feature) => feature.geometry));

  if (anchor === null) return null;

  return (
    <Marker
      longitude={anchor[0]}
      latitude={anchor[1]}
      anchor="center"
      style={{ pointerEvents: 'none' }}
    >
      <span
        aria-hidden
        data-slot="parcel-number"
        className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-md"
      >
        {number}
      </span>
    </Marker>
  );
}
