import { Marker } from 'react-map-gl/maplibre';

import { parcelNumber } from '@/lib/analysis/parcel-label';
import type { FilteredParcel } from '@/lib/api/parcels/schemas';
import { labelAnchor } from '@/lib/map/label-anchor';
import { formatNumbers, placeLabelClusters } from '@/lib/map/label-clusters';
import { cn } from '@/lib/utils';

/**
 * The parcels' numbers over the map, one chip per parcel at the centroid of its largest
 * ring, chips that would overlap merged into one ("1–3"). The highlighted parcel's chip
 * is in the parcel yellow, the others' white. DOM markers rather than a symbol layer:
 * the satellite style has no glyphs, so MapLibre could not draw text. The chips let
 * clicks through to the parcel underneath. A parcel outside `parcelIds` gets no number.
 * `zoom` is the camera's, from the map's `onMoveEnd`: overlap depends on it alone, so
 * the grouping is a pure function of anchors and zoom. Runs inside `<Map>`, mounted from
 * `FilteredParcelsLayer`.
 */
export function ParcelNumbers({
  parcels,
  parcelIds,
  zoom,
}: Readonly<{ parcels: FilteredParcel[]; parcelIds: string[]; zoom: number }>) {
  const anchors = parcels.flatMap((parcel) => {
    const number = parcelNumber(parcel.parcel_id, parcelIds);
    const lngLat =
      number === null
        ? null
        : labelAnchor(parcel.geometry.features.map((feature) => feature.geometry));

    return number === null || lngLat === null
      ? []
      : [{ number, lngLat, highlighted: parcel.selected }];
  });
  const clusters = placeLabelClusters(anchors, zoom);

  return clusters.map(({ numbers, lngLat, highlighted }) => (
    <Marker
      key={numbers[0]}
      longitude={lngLat[0]}
      latitude={lngLat[1]}
      anchor="center"
      style={{ pointerEvents: 'none' }}
    >
      <span
        aria-hidden
        data-slot="parcel-number"
        className={cn(
          // A circle for one digit, a pill for a merged "1–3". `font-sans` because MapLibre
          // sets Helvetica on the whole map container and the marker inherits it.
          'inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2.5 font-sans text-xs font-semibold whitespace-nowrap text-black',
          highlighted ? 'bg-parcel' : 'bg-white',
        )}
      >
        {formatNumbers(numbers)}
      </span>
    </Marker>
  ));
}
