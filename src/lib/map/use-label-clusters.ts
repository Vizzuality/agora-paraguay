import type { Map } from 'maplibre-gl';
import { useCallback, useSyncExternalStore } from 'react';
import { useMap } from 'react-map-gl/maplibre';

import type { LngLat } from '@/lib/map/label-anchor';
import { clusterLabels, type LabelCluster } from '@/lib/map/label-clusters';

/**
 * Centre-to-centre distance in px under which two number chips are read as overlapping:
 * a one-digit pill is about 40px wide.
 */
const CLUSTER_RADIUS = 40;

/** A cluster placed back on the map: the chip text, its highlight and where to pin it. */
export type PlacedCluster = Pick<LabelCluster, 'numbers' | 'highlighted'> & { lngLat: LngLat };

/**
 * Clusters parcel-number chips that would overlap on screen. Overlap depends on the
 * camera, so the map is read as an external store: the camera key is the snapshot and
 * `moveend`/`resize` are the change events, which re-render this hook and re-project.
 * `moveend` rather than `move`: the markers glide with the map on their own, and
 * regrouping once per gesture is enough; a merged chip may split a beat after the zoom
 * settles. `clusterLabels` does the grouping. Empty until the map exists. Runs inside
 * `<Map>`.
 */
export function useLabelClusters(
  anchors: readonly { number: number; lngLat: LngLat; highlighted: boolean }[],
): PlacedCluster[] {
  const { current: mapRef } = useMap();
  const map = mapRef?.getMap();

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!map) return () => {};

      map.on('moveend', onChange);
      map.on('resize', onChange);

      return () => {
        map.off('moveend', onChange);
        map.off('resize', onChange);
      };
    },
    [map],
  );

  useSyncExternalStore(
    subscribe,
    () => cameraKey(map),
    () => '',
  );

  if (!map) return [];

  const points = anchors.map(({ number, lngLat, highlighted }) => {
    const { x, y } = map.project(lngLat);

    return { number, x, y, highlighted };
  });

  return clusterLabels(points, CLUSTER_RADIUS).map(({ numbers, x, y, highlighted }) => {
    const { lng, lat } = map.unproject([x, y]);

    return { numbers, highlighted, lngLat: [lng, lat] };
  });
}

/** Everything the projection depends on, as a string so equal cameras compare equal. */
function cameraKey(map: Map | undefined): string {
  if (!map) return '';

  const { lng, lat } = map.getCenter();
  const { width, height } = map.getCanvas();

  return `${map.getZoom()}|${lng}|${lat}|${map.getBearing()}|${map.getPitch()}|${width}x${height}`;
}
