import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl/maplibre';

import { parcelQueries } from '@/lib/api/parcels/queries';
import { featuresBounds, FIT_PADDING } from '@/lib/map/area-bounds';
import { activeParcelIdAtom, analysedParcelIdsAtom } from '@/store/analysis';
import { drawPolygonsAtom } from '@/store/draw';

/**
 * Frames the hero mini map on the open tab: the parcel's own bounds, or every analysed
 * parcel for Todas. Animated, so the eye follows the change. The mount is left to
 * `initialViewState` — only a tab change moves the camera, never the first paint.
 * Runs inside `<Map>`, mounted from `MiniMap`.
 */
export function useFitActiveParcel() {
  const { current: mapRef } = useMap();
  const polygons = useAtomValue(drawPolygonsAtom);
  const analysedIds = useAtomValue(analysedParcelIdsAtom);
  const activeId = useAtomValue(activeParcelIdAtom);
  const { data } = useQuery(parcelQueries.filtered(polygons));
  // The tab the camera last framed; `undefined` until mount. Only a tab change moves the
  // camera — a re-answered parcel query for the same tab must not yank it back.
  const framedTab = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (framedTab.current === undefined) {
      framedTab.current = activeId;
      return;
    }

    const map = mapRef?.getMap();
    if (framedTab.current === activeId || !map || !data) return;

    const framed = activeId === null ? analysedIds : [activeId];
    const bounds = featuresBounds(
      data.results
        .filter((parcel) => framed.includes(parcel.parcel_id))
        .flatMap((parcel) => parcel.geometry.features),
    );

    if (bounds) map.fitBounds(bounds, { padding: FIT_PADDING });
    framedTab.current = activeId;
  }, [activeId, analysedIds, data, mapRef]);
}
