import { Marker } from 'react-map-gl/maplibre';

import { parcelNumber } from '@/lib/analysis/parcel-label';
import type { FilteredParcel } from '@/lib/api/parcels/schemas';
import { labelAnchor } from '@/lib/map/label-anchor';
import { formatNumbers } from '@/lib/map/label-clusters';
import { useLabelClusters } from '@/lib/map/use-label-clusters';

/**
 * The parcels' numbers over the map, one chip per parcel at the centroid of its largest
 * ring, chips that would overlap merged into one ("1–3"). DOM markers rather than a
 * symbol layer: the satellite style has no glyphs, so MapLibre could not draw text. The
 * chips let clicks through to the parcel underneath. A parcel outside `parcelIds` gets
 * no number. Runs inside `<Map>`, mounted from `FilteredParcelsLayer`.
 */
export function ParcelNumbers({
  parcels,
  parcelIds,
}: Readonly<{ parcels: FilteredParcel[]; parcelIds: string[] }>) {
  const anchors = parcels.flatMap((parcel) => {
    const number = parcelNumber(parcel.parcel_id, parcelIds);
    const lngLat =
      number === null
        ? null
        : labelAnchor(parcel.geometry.features.map((feature) => feature.geometry));

    return number === null || lngLat === null ? [] : [{ number, lngLat }];
  });
  const clusters = useLabelClusters(anchors);

  return clusters.map(({ numbers, lngLat }) => (
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
        className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold whitespace-nowrap text-primary-foreground shadow-md"
      >
        {formatNumbers(numbers)}
      </span>
    </Marker>
  ));
}
