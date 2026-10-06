import { describe, expect, it } from 'vitest';

import {
  clusterLabels,
  formatNumbers,
  placeLabelClusters,
  projectToWorld,
  unprojectFromWorld,
} from '@/lib/map/label-clusters';

describe('clusterLabels', () => {
  it('keeps chips apart when they do not overlap', () => {
    const clusters = clusterLabels(
      [
        { number: 1, x: 0, y: 0, highlighted: true },
        { number: 2, x: 100, y: 0, highlighted: false },
      ],
      24,
    );

    expect(clusters).toEqual([
      { numbers: [1], x: 0, y: 0, highlighted: true },
      { numbers: [2], x: 100, y: 0, highlighted: false },
    ]);
  });

  it('merges chips within the radius and centres the group on its members', () => {
    const clusters = clusterLabels(
      [
        { number: 3, x: 10, y: 0, highlighted: false },
        { number: 1, x: 0, y: 0, highlighted: false },
        { number: 2, x: 20, y: 0, highlighted: true },
      ],
      24,
    );

    // One highlighted member paints the whole chip.
    expect(clusters).toEqual([{ numbers: [1, 2, 3], x: 10, y: 0, highlighted: true }]);
  });

  it('measures against the moving cluster centre, not the first member', () => {
    // 1 and 2 merge at x=12; 3 at x=30 is 18 from that centre, so it joins too.
    const clusters = clusterLabels(
      [
        { number: 1, x: 0, y: 0, highlighted: false },
        { number: 2, x: 24, y: 0, highlighted: false },
        { number: 3, x: 30, y: 0, highlighted: false },
      ],
      24,
    );

    expect(clusters.map((cluster) => cluster.numbers)).toEqual([[1, 2, 3]]);
  });

  it('has no clusters without points', () => {
    expect(clusterLabels([], 24)).toEqual([]);
  });
});

describe('formatNumbers', () => {
  it('reads one number as is', () => {
    expect(formatNumbers([4])).toBe('4');
  });

  it('lists two numbers, consecutive or not', () => {
    expect(formatNumbers([1, 2])).toBe('1, 2');
    expect(formatNumbers([1, 5])).toBe('1, 5');
  });

  it('collapses runs of three or more', () => {
    expect(formatNumbers([1, 2, 3])).toBe('1–3');
    expect(formatNumbers([1, 2, 3, 5, 7, 8, 9])).toBe('1–3, 5, 7–9');
  });
});

describe('projectToWorld / unprojectFromWorld', () => {
  it('round-trips a point over Paraguay', () => {
    const point: [number, number] = [-58.44, -23.44];
    const { x, y } = projectToWorld(point, 7);
    const [lng, lat] = unprojectFromWorld(x, y, 7);

    expect(lng).toBeCloseTo(point[0], 9);
    expect(lat).toBeCloseTo(point[1], 9);
  });

  it('doubles pixel distances per zoom level', () => {
    const a: [number, number] = [-58.4, -23.4];
    const b: [number, number] = [-58.3, -23.4];
    const at = (zoom: number) => projectToWorld(b, zoom).x - projectToWorld(a, zoom).x;

    expect(at(8)).toBeCloseTo(at(7) * 2);
  });
});

describe('placeLabelClusters', () => {
  const anchors = [
    { number: 1, lngLat: [-58.4, -23.4] as [number, number], highlighted: true },
    { number: 2, lngLat: [-58.39, -23.4] as [number, number], highlighted: false },
  ];

  it('merges neighbours zoomed out and keeps them apart zoomed in', () => {
    // ~0.01° of longitude is ~2px at zoom 7 and ~580px at zoom 15.
    expect(placeLabelClusters(anchors, 7).map((cluster) => cluster.numbers)).toEqual([[1, 2]]);
    expect(placeLabelClusters(anchors, 15).map((cluster) => cluster.numbers)).toEqual([[1], [2]]);
  });

  it('pins a merged chip between its members and keeps the highlight', () => {
    const [cluster] = placeLabelClusters(anchors, 7);

    expect(cluster.highlighted).toBe(true);
    expect(cluster.lngLat[0]).toBeCloseTo(-58.395, 6);
    expect(cluster.lngLat[1]).toBeCloseTo(-23.4, 6);
  });
});
