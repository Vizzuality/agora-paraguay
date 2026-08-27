import { useQuery } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import type { MapMouseEvent } from 'maplibre-gl';
import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';

import { parcelQueries } from '@/lib/api/queries';
import { parcelAtPoint } from '@/lib/map/parcel-selection';
import { polygonAtPoint } from '@/lib/map/point-in-polygon';
import { parcelClickEnabledAtom, selectParcelAtPointAtom } from '@/store/analysis';
import { drawPolygonsAtom } from '@/store/draw';
import { toggleParcelAtom } from '@/store/parcels';

/**
 * Click-to-select on the map: while no tool is active and the session has not been
 * analyzed, clicking picks an area for analysis and hovering one shows a pointer.
 * Drawn and uploaded polygons win over the cadastral layer — they render on top —
 * and select as the single analysis highlight; a cadastral parcel underneath toggles
 * in and out of the multi-select (`src/store/parcels.ts`).
 *
 * The hit-tests run against the app's own geometry (`point-in-polygon.ts`,
 * `parcel-selection.ts`), not against rendered layers: Terra Draw's layer ids are
 * adapter-private, and `queryRenderedFeatures` returns tile-clipped geometry.
 * Listeners attach only while `parcelClickEnabledAtom` holds, so draw and edit modes
 * never see them; the cursor is reset on detach so a pointer never survives into
 * another mode.
 *
 * Runs inside `<Map>` (needs react-map-gl's context), mounted from `DrawLayer`.
 */
export function useParcelClick() {
  const { current: mapRef } = useMap();
  const enabled = useAtomValue(parcelClickEnabledAtom);
  const polygons = useAtomValue(drawPolygonsAtom);
  const { data: parcelData } = useQuery(parcelQueries.all());
  const selectParcelAtPoint = useSetAtom(selectParcelAtPointAtom);
  const toggleParcel = useSetAtom(toggleParcelAtom);

  useEffect(() => {
    const map = mapRef?.getMap();

    if (!map || !enabled) return;

    const parcels = parcelData?.features ?? [];

    const onClick = (event: MapMouseEvent) => {
      const point = { lng: event.lngLat.lng, lat: event.lngLat.lat };

      if (polygonAtPoint(polygons, point) !== null) {
        selectParcelAtPoint(point);

        return;
      }

      const parcel = parcelAtPoint(parcels, point);

      if (parcel !== null) toggleParcel(parcel);
    };

    const onMouseMove = (event: MapMouseEvent) => {
      const hit =
        polygonAtPoint(polygons, event.lngLat) !== null ||
        parcelAtPoint(parcels, event.lngLat) !== null;

      map.getCanvas().style.cursor = hit ? 'pointer' : '';
    };

    map.on('click', onClick);
    map.on('mousemove', onMouseMove);

    return () => {
      map.off('click', onClick);
      map.off('mousemove', onMouseMove);
      map.getCanvas().style.cursor = '';
    };
  }, [mapRef, enabled, polygons, parcelData, selectParcelAtPoint, toggleParcel]);
}
