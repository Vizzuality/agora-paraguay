import { describe, expect, it } from 'vitest';

import type { DrawnPolygon } from '@/lib/map/draw-features';
import {
  canSelectParcel,
  drawReducer,
  INITIAL_DRAW_STATE,
  terraDrawMode,
  type DrawState,
} from '@/lib/map/draw-state';

function polygon(id: string) {
  return {
    id,
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [[]] },
    properties: { mode: 'polygon' },
  } as DrawnPolygon;
}

const first = polygon('polygon-1');
const second = polygon('polygon-2');

const bound: DrawState = { ...INITIAL_DRAW_STATE, bound: true };
const drawn: DrawState = { ...bound, tool: 'draw', polygons: [first, second] };

describe('drawReducer', () => {
  it('marks the instance bound and unbound', () => {
    expect(drawReducer(INITIAL_DRAW_STATE, { type: 'bound' }).bound).toBe(true);
  });

  it('keeps the polygons on unbind — the selection survives the map unmount', () => {
    expect(drawReducer(drawn, { type: 'unbound' })).toEqual({
      ...INITIAL_DRAW_STATE,
      polygons: [first, second],
    });
  });

  it('keeps the draw tool over an empty map — a drawing session starts from scratch', () => {
    const drawing: DrawState = { ...bound, tool: 'draw' };

    expect(drawReducer(drawing, { type: 'geometry', polygons: [] }).tool).toBe('draw');
  });

  it('keeps every polygon reported, not just the newest', () => {
    const next = drawReducer(bound, { type: 'geometry', polygons: [first, second] });

    expect(next.polygons.map((item) => item.id)).toEqual([first.id, second.id]);
  });
});

describe('analysis selection', () => {
  const analysing: DrawState = { ...drawn, analysisId: first.id };

  it('selects and clears the analysis polygon', () => {
    expect(drawReducer(drawn, { type: 'analysisSelected', id: first.id }).analysisId).toBe(
      first.id,
    );
    expect(drawReducer(analysing, { type: 'analysisCleared' }).analysisId).toBeNull();
  });

  it('survives tool changes: it is not tied to any Terra Draw mode', () => {
    expect(drawReducer(analysing, { type: 'tool', tool: 'draw' }).analysisId).toBe(first.id);
    expect(drawReducer(analysing, { type: 'tool', tool: null }).analysisId).toBe(first.id);
  });

  it('is pruned when its polygon leaves the store', () => {
    expect(drawReducer(analysing, { type: 'geometry', polygons: [first] }).analysisId).toBe(
      first.id,
    );
    expect(drawReducer(analysing, { type: 'geometry', polygons: [second] }).analysisId).toBeNull();
  });

  it('survives unbind with the polygons it points into', () => {
    expect(drawReducer(analysing, { type: 'unbound' }).analysisId).toBe(first.id);
  });
});

describe('terraDrawMode', () => {
  it('is static until the instance is bound', () => {
    expect(terraDrawMode({ ...INITIAL_DRAW_STATE, tool: 'draw' })).toBe('static');
  });

  it('maps the tool onto a Terra Draw mode', () => {
    expect(terraDrawMode(bound)).toBe('static');
    expect(terraDrawMode({ ...bound, tool: 'draw' })).toBe('polygon');
  });
});

describe('canSelectParcel', () => {
  it('allows parcel clicks only while the map is idle', () => {
    const idle: DrawState = { ...bound, tool: null, polygons: [first, second] };

    expect(canSelectParcel(idle)).toBe(true);
    expect(canSelectParcel({ ...idle, bound: false })).toBe(false);
    expect(canSelectParcel({ ...idle, tool: 'draw' })).toBe(false);
    // An empty draw store still allows clicks: cadastral parcels are selectable
    // without anything drawn. The app-mode gate lives in `parcelClickEnabledAtom`.
    expect(canSelectParcel({ ...idle, polygons: [] })).toBe(true);
  });
});
