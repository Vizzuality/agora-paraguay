import { useAtom } from 'jotai';
import type { MapMouseEvent } from 'maplibre-gl';
import { useEffect, useMemo, useRef } from 'react';
import { useMap } from 'react-map-gl/maplibre';

import { resolveActiveParcel } from '@/lib/analysis/active-parcel';
import type { FilteredParcel } from '@/lib/api/parcels/schemas';
import { featuresBounds, FIT_PADDING } from '@/lib/map/area-bounds';
import { parcelAtPoint } from '@/lib/map/parcel-selection';
import { activeParcelIdAtom } from '@/store/analysis';

/** Camera move when the active tab changes — long enough to read, short enough to not lag a click. */
const FIT_DURATION_MS = 600;

/**
 * Keeps the hero mini map and the parcel tabs on the same parcel, both ways: clicking a
 * submitted parcel on the map makes it the active tab (clicking it again goes back to
 * Todas), and a tab change frames that parcel — Todas frames them all. Only submitted
 * parcels are clickable; the outlined ones around them are context. The hit-test runs
 * against the answer's own geometry like `useParcelClick`, and the cursor is reset on
 * detach. Runs inside `<Map>` (needs react-map-gl's context).
 */
export function useActiveParcelSync({
  parcels,
  submitted,
}: Readonly<{ parcels: FilteredParcel[]; submitted: string[] }>) {
  const { current: mapRef } = useMap();
  const [stored, setActive] = useAtom(activeParcelIdAtom);
  const active = resolveActiveParcel(submitted, stored);

  const submittedParcels = useMemo(
    () => parcels.filter((parcel) => submitted.includes(parcel.parcel_id)),
    [parcels, submitted],
  );

  useEffect(() => {
    const map = mapRef?.getMap();

    if (!map || submittedParcels.length === 0) return;

    const onClick = (event: MapMouseEvent) => {
      const hit = parcelAtPoint(submittedParcels, event.lngLat);

      if (hit !== null) setActive(hit.parcel_id === active ? null : hit.parcel_id);
    };

    const onMouseMove = (event: MapMouseEvent) => {
      map.getCanvas().style.cursor =
        parcelAtPoint(submittedParcels, event.lngLat) === null ? '' : 'pointer';
    };

    map.on('click', onClick);
    map.on('mousemove', onMouseMove);

    return () => {
      map.off('click', onClick);
      map.off('mousemove', onMouseMove);
      map.getCanvas().style.cursor = '';
    };
  }, [mapRef, submittedParcels, active, setActive]);

  // The mount already framed everything (`initialViewState`); only a change re-frames.
  const framed = useRef(active);

  useEffect(() => {
    const map = mapRef?.getMap();

    if (!map || framed.current === active) return;

    framed.current = active;

    const target =
      active === null
        ? submittedParcels
        : submittedParcels.filter((parcel) => parcel.parcel_id === active);
    const bounds = featuresBounds(target.flatMap((parcel) => parcel.geometry.features));

    if (bounds !== null) map.fitBounds(bounds, { padding: FIT_PADDING, duration: FIT_DURATION_MS });
  }, [mapRef, active, submittedParcels]);
}
