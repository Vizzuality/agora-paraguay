import { useQuery } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import type { MapMouseEvent } from 'maplibre-gl';
import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';

import { parcelQueries } from '@/lib/api/parcels/queries';
import type { FilteredParcel } from '@/lib/api/parcels/schemas';
import { parcelAtPoint } from '@/lib/map/parcel-selection';
import { drawPolygonsAtom } from '@/store/draw';
import { parcelClickEnabledAtom, toggleParcelAtom } from '@/store/parcels';

/**
 * Click-to-parcel on a map: while `enabled`, clicking one of `parcels` hands it to
 * `onParcel`, and hovering one shows a pointer. What the click means is the caller's —
 * flipping the selection on the main map, opening a tab on the hero mini map.
 *
 * The hit-test runs against the answer's own geometry (`parcel-selection.ts`), not the
 * rendered layers: `queryRenderedFeatures` returns tile-clipped geometry. Listeners
 * attach only while `enabled` holds; the cursor is reset on detach so a pointer never
 * survives into another mode.
 *
 * Runs inside `<Map>` (needs react-map-gl's context).
 */
export function useParcelHitClick({
  parcels,
  enabled,
  onParcel,
}: {
  parcels: FilteredParcel[] | undefined;
  enabled: boolean;
  onParcel: (parcelId: string) => void;
}) {
  const { current: mapRef } = useMap();

  useEffect(() => {
    const map = mapRef?.getMap();

    if (!map || !enabled || !parcels || parcels.length === 0) return;

    const onClick = (event: MapMouseEvent) => {
      const parcel = parcelAtPoint(parcels, event.lngLat);

      if (parcel !== null) onParcel(parcel.parcel_id);
    };

    const onMouseMove = (event: MapMouseEvent) => {
      map.getCanvas().style.cursor = parcelAtPoint(parcels, event.lngLat) === null ? '' : 'pointer';
    };

    map.on('click', onClick);
    map.on('mousemove', onMouseMove);

    return () => {
      map.off('click', onClick);
      map.off('mousemove', onMouseMove);
      map.getCanvas().style.cursor = '';
    };
  }, [mapRef, enabled, parcels, onParcel]);
}

/**
 * The main map's click-to-flip: while no tool is active and the app is in selection
 * mode, clicking one of the parcels `filter-parcels` answered toggles its selection
 * (`src/store/parcels.ts`). Draw mode never sees the listeners. Mounted from `DrawLayer`.
 */
export function useParcelClick() {
  const enabled = useAtomValue(parcelClickEnabledAtom);
  const polygons = useAtomValue(drawPolygonsAtom);
  const { data } = useQuery(parcelQueries.filtered(polygons));
  const toggleParcel = useSetAtom(toggleParcelAtom);

  useParcelHitClick({ parcels: data?.results, enabled, onParcel: toggleParcel });
}
