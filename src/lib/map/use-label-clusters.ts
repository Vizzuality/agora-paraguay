import { useEffect, useState } from 'react';
import { useMap } from 'react-map-gl/maplibre';

import type { LngLat } from '@/lib/map/label-anchor';
import { clusterLabels, type LabelCluster } from '@/lib/map/label-clusters';

/** Centre-to-centre distance in px under which two number chips are read as overlapping. */
const CLUSTER_RADIUS = 28;

/** A cluster placed back on the map: the chip text and where to pin it. */
export type PlacedCluster = Pick<LabelCluster, 'numbers'> & { lngLat: LngLat };

/**
 * Clusters parcel-number chips that would overlap on screen. Projection is per camera,
 * so it re-runs on every move and resize of the enclosing map; `clusterLabels` does
 * the grouping. Empty until the map exists. Runs inside `<Map>`.
 */
export function useLabelClusters(
  anchors: readonly { number: number; lngLat: LngLat }[],
): PlacedCluster[] {
  const { current: mapRef } = useMap();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;

    const bump = () => setTick((value) => value + 1);

    map.on('move', bump);
    map.on('resize', bump);

    return () => {
      map.off('move', bump);
      map.off('resize', bump);
    };
  }, [mapRef]);

  const map = mapRef?.getMap();
  if (!map) return [];

  // `tick` is only read so the projection below follows the camera.
  void tick;

  const points = anchors.map(({ number, lngLat }) => {
    const { x, y } = map.project(lngLat);

    return { number, x, y };
  });

  return clusterLabels(points, CLUSTER_RADIUS).map(({ numbers, x, y }) => {
    const { lng, lat } = map.unproject([x, y]);

    return { numbers, lngLat: [lng, lat] };
  });
}
