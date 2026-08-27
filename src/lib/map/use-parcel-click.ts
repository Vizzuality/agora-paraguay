import { useQuery } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import type { MapMouseEvent } from 'maplibre-gl';
import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';

import { parcelQueries } from '@/lib/api/queries';
import { parcelAtPoint } from '@/lib/map/parcel-selection';
import { parcelClickEnabledAtom } from '@/store/analysis';
import { toggleParcelAtom } from '@/store/parcels';

/**
 * Click-to-select on the map: while no tool is active and the app is in selection
 * mode, clicking a cadastral parcel toggles it in and out of the multi-select
 * (`src/store/parcels.ts`), and hovering one shows a pointer.
 *
 * The hit-test runs against the app's own geometry (`parcel-selection.ts`), not
 * against rendered layers: `queryRenderedFeatures` returns tile-clipped geometry.
 * Listeners attach only while `parcelClickEnabledAtom` holds, so draw mode never
 * sees them; the cursor is reset on detach so a pointer never survives into
 * another mode.
 *
 * Runs inside `<Map>` (needs react-map-gl's context), mounted from `DrawLayer`.
 */
export function useParcelClick() {
  const { current: mapRef } = useMap();
  const enabled = useAtomValue(parcelClickEnabledAtom);
  const { data: parcelData } = useQuery(parcelQueries.all());
  const toggleParcel = useSetAtom(toggleParcelAtom);

  useEffect(() => {
    const map = mapRef?.getMap();

    if (!map || !enabled) return;

    const parcels = parcelData?.features ?? [];

    const onClick = (event: MapMouseEvent) => {
      const parcel = parcelAtPoint(parcels, event.lngLat);

      if (parcel !== null) toggleParcel(parcel);
    };

    const onMouseMove = (event: MapMouseEvent) => {
      const hit = parcelAtPoint(parcels, event.lngLat) !== null;

      map.getCanvas().style.cursor = hit ? 'pointer' : '';
    };

    map.on('click', onClick);
    map.on('mousemove', onMouseMove);

    return () => {
      map.off('click', onClick);
      map.off('mousemove', onMouseMove);
      map.getCanvas().style.cursor = '';
    };
  }, [mapRef, enabled, parcelData, toggleParcel]);
}
