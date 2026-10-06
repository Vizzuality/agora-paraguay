/**
 * A parcel number with its chip's screen position, in px from the map's top-left, and
 * whether its parcel is the highlighted one.
 */
export type LabelPoint = { number: number; x: number; y: number; highlighted: boolean };

/**
 * Numbers sharing one chip, where it sits (the mean of its members' positions) and
 * whether any member is highlighted, which paints the whole chip.
 */
export type LabelCluster = { numbers: number[]; x: number; y: number; highlighted: boolean };

/**
 * Groups parcel numbers whose chips would overlap on screen: a point joins the first
 * cluster whose centre lies within `radius` px, else starts its own. Greedy and
 * order-dependent on purpose: it is cheap, it runs on every map move, and parcel
 * numbers are few. Numbers come out ascending within each cluster.
 */
export function clusterLabels(points: readonly LabelPoint[], radius: number): LabelCluster[] {
  const clusters: LabelCluster[] = [];

  for (const point of [...points].sort((a, b) => a.number - b.number)) {
    const cluster = clusters.find(
      (entry) => Math.hypot(entry.x - point.x, entry.y - point.y) <= radius,
    );

    if (cluster === undefined) {
      clusters.push({
        numbers: [point.number],
        x: point.x,
        y: point.y,
        highlighted: point.highlighted,
      });
      continue;
    }

    const size = cluster.numbers.length;

    cluster.numbers.push(point.number);
    cluster.highlighted ||= point.highlighted;
    cluster.x = (cluster.x * size + point.x) / (size + 1);
    cluster.y = (cluster.y * size + point.y) / (size + 1);
  }

  return clusters;
}

/**
 * What a cluster's chip reads: runs of three or more consecutive numbers collapse to
 * "1–3", everything else is listed. Expects ascending input, as `clusterLabels` gives.
 */
export function formatNumbers(numbers: readonly number[]): string {
  const parts: string[] = [];
  let start = 0;

  for (let index = 1; index <= numbers.length; index++) {
    const continues = index < numbers.length && numbers[index] === numbers[index - 1] + 1;

    if (continues) continue;

    const run = numbers.slice(start, index);

    parts.push(run.length >= 3 ? `${run[0]}–${run.at(-1)}` : run.join(', '));
    start = index;
  }

  return parts.join(', ');
}

/** `[lng, lat]`, the order GeoJSON and MapLibre markers use. */
export type LngLat = [number, number];

/** A cluster placed back on the map: the chip text, its highlight and where to pin it. */
export type PlacedCluster = Pick<LabelCluster, 'numbers' | 'highlighted'> & { lngLat: LngLat };

/**
 * Centre-to-centre distance in px under which two number chips are read as overlapping:
 * a one-digit pill is about 40px wide.
 */
export const CLUSTER_RADIUS = 40;

/** MapLibre's world size in px at a zoom: 512px tiles, doubling per level. */
const worldSize = (zoom: number) => 512 * 2 ** zoom;

/**
 * Web Mercator, lng/lat to px in the zoom's world. Centre and viewport are left out on
 * purpose: distances between two points do not depend on them, which is all the
 * clustering needs. Bearing and pitch are assumed 0 (the mini map disables both).
 */
export function projectToWorld([lng, lat]: LngLat, zoom: number): { x: number; y: number } {
  const size = worldSize(zoom);
  const latRad = (lat * Math.PI) / 180;

  return {
    x: ((lng + 180) / 360) * size,
    y: ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * size,
  };
}

/** The inverse of `projectToWorld`. */
export function unprojectFromWorld(x: number, y: number, zoom: number): LngLat {
  const size = worldSize(zoom);
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / size))) * 180) / Math.PI;

  return [(x / size) * 360 - 180, lat];
}

/**
 * Where the chips go at a zoom: anchors projected, grouped by `clusterLabels`, each
 * group's centre put back on the map. Pure, so the caller only has to feed it the
 * camera's zoom (the mini map's `onMoveEnd`).
 */
export function placeLabelClusters(
  anchors: readonly { number: number; lngLat: LngLat; highlighted: boolean }[],
  zoom: number,
  radius = CLUSTER_RADIUS,
): PlacedCluster[] {
  const points = anchors.map(({ number, lngLat, highlighted }) => ({
    number,
    highlighted,
    ...projectToWorld(lngLat, zoom),
  }));

  return clusterLabels(points, radius).map(({ numbers, x, y, highlighted }) => ({
    numbers,
    highlighted,
    lngLat: unprojectFromWorld(x, y, zoom),
  }));
}
