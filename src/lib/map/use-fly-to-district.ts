import type { Map as MapLibreMap } from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl/maplibre';

import { GLOBAL_LAYER_SOURCE_LAYER } from '@/lib/api/layers/queries';
import {
  featuresBounds,
  FIT_PADDING,
  type ArealGeometry,
  type Bounds,
} from '@/lib/map/area-bounds';
import {
  DISTRICT_KEY_EXPRESSION,
  districtFlight,
  type ExposureDistrict,
} from '@/lib/map/exposure-districts';
import { PARAGUAY_VIEW_STATE } from '@/lib/map/view-state';

// Not `essential`: with reduced motion asked for, MapLibre jumps to the district instead.
const FLIGHT = { duration: 1200 } as const;

/**
 * The district's box from every tile piece of it (`querySourceFeatures`), not the
 * clipped piece under the pointer — only from the tiles loaded so far, so a district
 * reaching past the view measures partly.
 */
export function districtBounds(
  map: MapLibreMap,
  sourceId: string,
  districtId: string,
): Bounds | null {
  const pieces = map
    .querySourceFeatures(sourceId, {
      sourceLayer: GLOBAL_LAYER_SOURCE_LAYER,
      filter: ['==', DISTRICT_KEY_EXPRESSION, districtId],
    })
    .filter((feature): feature is typeof feature & { geometry: ArealGeometry } =>
      ['Polygon', 'MultiPolygon'].includes(feature.geometry.type),
    );

  return featuresBounds(pieces);
}

/**
 * Follows the picked district with the camera: centres it when picked, back to the
 * country when the pick is cleared (on the map or the panel's Limpiar). A map mounting
 * with a district already picked, as the settings column's does after a pick on the
 * content column's, frames it from the box measured at the pick. Runs inside `<Map>`.
 */
export function useFlyToDistrict(
  sourceId: string,
  district: Pick<ExposureDistrict, 'id' | 'bounds'> | null,
) {
  const { current: map } = useMap();
  const previous = useRef<string | null>(null);
  const districtId = district?.id ?? null;
  const knownBounds = district?.bounds ?? null;

  useEffect(() => {
    if (!map) return;

    const flight = districtFlight(
      previous.current,
      districtId === null ? null : { id: districtId, bounds: knownBounds },
    );
    previous.current = districtId;
    if (!flight) return;

    if (flight.to === 'country') {
      map.flyTo({
        center: [PARAGUAY_VIEW_STATE.longitude, PARAGUAY_VIEW_STATE.latitude],
        zoom: PARAGUAY_VIEW_STATE.zoom,
        ...FLIGHT,
      });
      return;
    }

    const bounds = flight.bounds ?? districtBounds(map.getMap(), sourceId, districtId!);
    if (bounds) map.fitBounds(bounds, { padding: FIT_PADDING, maxZoom: 11, ...FLIGHT });
  }, [map, sourceId, districtId, knownBounds]);
}
