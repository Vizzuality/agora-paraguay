import { useQuery } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import type { MapMouseEvent } from 'maplibre-gl';
import { useEffect } from 'react';
import { useMap } from 'react-map-gl/maplibre';

import { parcelQueries } from '@/lib/api/parcels/queries';
import { parcelAtPoint } from '@/lib/map/parcel-selection';
import { drawPolygonsAtom } from '@/store/draw';
import { parcelClickEnabledAtom, toggleParcelAtom } from '@/store/parcels';

/**
 * Click-to-flip on the map: while no tool is active and the app is in selection mode,
 * clicking one of the parcels `filter_parcels` answered toggles its selection
 * (`src/store/parcels.ts`), and hovering one shows a pointer.
 *
 * The hit-test runs against the answer's own geometry (`parcel-selection.ts`), not the
 * rendered layers: `queryRenderedFeatures` returns tile-clipped geometry. Listeners
 * attach only while `parcelClickEnabledAtom` holds, so draw mode never sees them; the
 * cursor is reset on detach so a pointer never survives into another mode.
 *
 * Runs inside `<Map>` (needs react-map-gl's context), mounted from `DrawLayer`.
 */
export function useParcelClick() {
  const { current: mapRef } = useMap();
  const enabled = useAtomValue(parcelClickEnabledAtom);
  const polygons = useAtomValue(drawPolygonsAtom);
  const { data } = useQuery(parcelQueries.filtered(polygons));
  const toggleParcel = useSetAtom(toggleParcelAtom);

  useEffect(() => {
    const map = mapRef?.getMap();
    const parcels = data?.results;

    if (!map || !enabled || !parcels || parcels.length === 0) return;

    const onClick = (event: MapMouseEvent) => {
      const parcel = parcelAtPoint(parcels, event.lngLat);

      if (parcel !== null) toggleParcel(parcel.parcel_id);
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
  }, [mapRef, enabled, data, toggleParcel]);
}
