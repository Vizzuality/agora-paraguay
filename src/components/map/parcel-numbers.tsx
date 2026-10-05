import { Marker } from 'react-map-gl/maplibre';

import { parcelNumber } from '@/lib/analysis/parcel-label';
import type { FilteredParcel } from '@/lib/api/parcels/schemas';
import { labelAnchor } from '@/lib/map/label-anchor';
import { formatNumbers } from '@/lib/map/label-clusters';
import { useLabelClusters } from '@/lib/map/use-label-clusters';
import { cn } from '@/lib/utils';

/**
 * The parcels' numbers over the map, one chip per parcel at the centroid of its largest
 * ring, chips that would overlap merged into one ("1–3"). Pills per Figma 5540:8119 and
 * 5540:8125: the highlighted parcel's in the parcel yellow, the others' white. DOM
 * markers rather than a symbol layer: the satellite style has no glyphs, so MapLibre
 * could not draw text. The chips let clicks through to the parcel underneath. A parcel
 * outside `parcelIds` gets no number. Runs inside `<Map>`, mounted from
 * `FilteredParcelsLayer`.
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

    return number === null || lngLat === null
      ? []
      : [{ number, lngLat, highlighted: parcel.selected }];
  });
  const clusters = useLabelClusters(anchors);

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
          'rounded-full px-4 py-2 text-xs leading-normal font-semibold whitespace-nowrap text-black',
          highlighted ? 'bg-parcel' : 'bg-white',
        )}
      >
        {formatNumbers(numbers)}
      </span>
    </Marker>
  ));
}
