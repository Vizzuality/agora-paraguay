import { useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl/maplibre';

import { featuresBounds, FIT_PADDING, type ArealGeometry } from '@/lib/map/area-bounds';
import { DISTRICT_KEY_EXPRESSION } from '@/lib/map/exposure-districts';
import { PARAGUAY_VIEW_STATE } from '@/lib/map/view-state';

const FLIGHT = { duration: 1200, essential: true } as const;

/**
 * Follows the picked district with the camera: frames it when picked, back to the
 * country when the pick is cleared (on the map or the panel's Limpiar). The bounds come
 * from every tile piece of the district (`querySourceFeatures`), not the clipped piece
 * under the pointer. Runs inside `<Map>`.
 */
export function useFlyToDistrict(sourceId: string, districtId: string | null) {
  const { current: map } = useMap();
  const previous = useRef<string | null>(districtId);

  useEffect(() => {
    const was = previous.current;
    previous.current = districtId;

    if (!map || districtId === was) return;

    if (districtId === null) {
      map.flyTo({
        center: [PARAGUAY_VIEW_STATE.longitude, PARAGUAY_VIEW_STATE.latitude],
        zoom: PARAGUAY_VIEW_STATE.zoom,
        ...FLIGHT,
      });
      return;
    }

    const pieces = map
      .querySourceFeatures(sourceId, { filter: ['==', DISTRICT_KEY_EXPRESSION, districtId] })
      .filter((feature): feature is typeof feature & { geometry: ArealGeometry } =>
        ['Polygon', 'MultiPolygon'].includes(feature.geometry.type),
      );
    const bounds = featuresBounds(pieces);

    if (bounds) map.fitBounds(bounds, { padding: FIT_PADDING, maxZoom: 11, ...FLIGHT });
  }, [map, sourceId, districtId]);
}
