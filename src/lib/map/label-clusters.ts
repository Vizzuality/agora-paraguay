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
