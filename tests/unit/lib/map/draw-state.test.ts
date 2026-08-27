import { describe, expect, it } from 'vitest';

import type { DrawnPolygon } from '@/lib/map/draw-features';
import {
  canClear,
  canDelete,
  canDraw,
  canEdit,
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
const drawn: DrawState = { ...bound, tool: 'edit', polygons: [first, second] };
const selected: DrawState = { ...drawn, selectedId: first.id };

describe('drawReducer', () => {
  it('marks the instance bound and unbound', () => {
    expect(drawReducer(INITIAL_DRAW_STATE, { type: 'bound' }).bound).toBe(true);
  });

  it('drops everything on unbind, because the instance owned the geometry', () => {
    expect(drawReducer(selected, { type: 'unbound' })).toEqual(INITIAL_DRAW_STATE);
  });

  it('keeps the selection when the tool stays on edit', () => {
    expect(drawReducer(selected, { type: 'tool', tool: 'edit' }).selectedId).toBe(first.id);
  });

  it('clears the selection when leaving edit, without waiting for a deselect event', () => {
    expect(drawReducer(selected, { type: 'tool', tool: 'draw' }).selectedId).toBeNull();
    expect(drawReducer(selected, { type: 'tool', tool: null }).selectedId).toBeNull();
  });

  it('releases the edit tool when the last polygon goes, so the toggle cannot stick pressed', () => {
    const next = drawReducer(selected, { type: 'geometry', polygons: [] });

    expect(next.tool).toBeNull();
    expect(terraDrawMode(next)).toBe('static');
  });

  it('keeps the draw tool over an empty map — a drawing session starts from scratch', () => {
    const drawing: DrawState = { ...bound, tool: 'draw' };

    expect(drawReducer(drawing, { type: 'geometry', polygons: [] }).tool).toBe('draw');
  });

  it('keeps every polygon reported, not just the newest', () => {
    const next = drawReducer(bound, { type: 'geometry', polygons: [first, second] });

    expect(next.polygons.map((item) => item.id)).toEqual([first.id, second.id]);
  });

  it('keeps the selection while the selected polygon is still there', () => {
    expect(drawReducer(selected, { type: 'geometry', polygons: [first] }).selectedId).toBe(
      first.id,
    );
  });

  it('clears the selection when the selected polygon goes away', () => {
    expect(drawReducer(selected, { type: 'geometry', polygons: [second] }).selectedId).toBeNull();
    expect(drawReducer(selected, { type: 'geometry', polygons: [] }).selectedId).toBeNull();
  });

  it('ignores a deselect for a feature that is not the current selection', () => {
    expect(drawReducer(selected, { type: 'deselected', id: second.id })).toBe(selected);
    expect(drawReducer(selected, { type: 'deselected', id: first.id }).selectedId).toBeNull();
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

  it('survives tool changes, unlike the edit selection', () => {
    expect(drawReducer(analysing, { type: 'tool', tool: 'draw' }).analysisId).toBe(first.id);
    expect(drawReducer(analysing, { type: 'tool', tool: null }).analysisId).toBe(first.id);
  });

  it('is pruned when its polygon leaves the store', () => {
    expect(drawReducer(analysing, { type: 'geometry', polygons: [first] }).analysisId).toBe(
      first.id,
    );
    expect(drawReducer(analysing, { type: 'geometry', polygons: [second] }).analysisId).toBeNull();
  });

  it('resets on unbind with everything else', () => {
    expect(drawReducer(analysing, { type: 'unbound' }).analysisId).toBeNull();
  });
});

describe('analyzed session', () => {
  const idle: DrawState = { ...bound, tool: null, polygons: [first, second] };
  const submitted: DrawState = { ...idle, analyzed: true };

  it('marks the session analyzed on submit', () => {
    expect(drawReducer(idle, { type: 'analysisSubmitted' }).analyzed).toBe(true);
  });

  it('survives parking the tool, which is how submitting itself ends the session', () => {
    expect(drawReducer(submitted, { type: 'tool', tool: null }).analyzed).toBe(true);
  });

  it('clears when any tool is picked up — a new session starts', () => {
    expect(drawReducer(submitted, { type: 'tool', tool: 'draw' }).analyzed).toBe(false);
    expect(drawReducer(submitted, { type: 'tool', tool: 'edit' }).analyzed).toBe(false);
  });

  it('clears on new geometry, so an upload after Analizar is clickable', () => {
    expect(drawReducer(submitted, { type: 'geometry', polygons: [first] }).analyzed).toBe(false);
  });

  it('resets on unbind with everything else', () => {
    expect(drawReducer(submitted, { type: 'unbound' }).analyzed).toBe(false);
  });
});

describe('terraDrawMode', () => {
  it('is static until the instance is bound', () => {
    expect(terraDrawMode({ ...INITIAL_DRAW_STATE, tool: 'draw' })).toBe('static');
  });

  it('maps the tool onto a Terra Draw mode', () => {
    expect(terraDrawMode(bound)).toBe('static');
    expect(terraDrawMode({ ...bound, tool: 'draw' })).toBe('polygon');
    expect(terraDrawMode({ ...bound, tool: 'edit' })).toBe('select');
  });
});

describe('control availability', () => {
  it('enables nothing before the instance is bound', () => {
    const unbound: DrawState = { ...selected, bound: false };

    expect([canDraw(unbound), canEdit(unbound), canDelete(unbound), canClear(unbound)]).toEqual([
      false,
      false,
      false,
      false,
    ]);
  });

  it('allows drawing but nothing else with an empty map', () => {
    expect([canDraw(bound), canEdit(bound), canDelete(bound), canClear(bound)]).toEqual([
      true,
      false,
      false,
      false,
    ]);
  });

  it('allows editing and clearing once any polygon exists, deleting only with a selection', () => {
    expect([canEdit(drawn), canClear(drawn), canDelete(drawn)]).toEqual([true, true, false]);
    expect(canDelete(selected)).toBe(true);
  });

  it('allows parcel clicks only idle and before Analizar', () => {
    const idle: DrawState = { ...bound, tool: null, polygons: [first, second] };

    expect(canSelectParcel(idle)).toBe(true);
    expect(canSelectParcel({ ...idle, bound: false })).toBe(false);
    expect(canSelectParcel({ ...idle, tool: 'draw' })).toBe(false);
    expect(canSelectParcel({ ...idle, tool: 'edit' })).toBe(false);
    // An empty draw store still allows clicks: cadastral parcels are selectable
    // without anything drawn.
    expect(canSelectParcel({ ...idle, polygons: [] })).toBe(true);
    expect(canSelectParcel({ ...idle, analyzed: true })).toBe(false);
  });
});
