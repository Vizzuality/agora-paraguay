import { describe, expect, it } from "vitest";

import type { DrawnPolygon } from "@/lib/map/draw-features";
import {
  canClear,
  canDelete,
  canDraw,
  canEdit,
  drawReducer,
  INITIAL_DRAW_STATE,
  terraDrawMode,
  type DrawState,
} from "@/lib/map/draw-state";

function polygon(id: string) {
  return {
    id,
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [[]] },
    properties: { mode: "polygon" },
  } as DrawnPolygon;
}

const first = polygon("polygon-1");
const second = polygon("polygon-2");

const bound: DrawState = { ...INITIAL_DRAW_STATE, bound: true };
const drawn: DrawState = { ...bound, tool: "edit", polygons: [first, second] };
const selected: DrawState = { ...drawn, selectedId: first.id };

describe("drawReducer", () => {
  it("marks the instance bound and unbound", () => {
    expect(drawReducer(INITIAL_DRAW_STATE, { type: "bound" }).bound).toBe(true);
  });

  it("drops everything on unbind, because the instance owned the geometry", () => {
    expect(drawReducer(selected, { type: "unbound" })).toEqual(INITIAL_DRAW_STATE);
  });

  it("keeps the selection when the tool stays on edit", () => {
    expect(drawReducer(selected, { type: "tool", tool: "edit" }).selectedId).toBe(first.id);
  });

  it("clears the selection when leaving edit, without waiting for a deselect event", () => {
    expect(drawReducer(selected, { type: "tool", tool: "draw" }).selectedId).toBeNull();
    expect(drawReducer(selected, { type: "tool", tool: null }).selectedId).toBeNull();
  });

  it("keeps every polygon reported, not just the newest", () => {
    const next = drawReducer(bound, { type: "geometry", polygons: [first, second] });

    expect(next.polygons.map((item) => item.id)).toEqual([first.id, second.id]);
  });

  it("keeps the selection while the selected polygon is still there", () => {
    expect(drawReducer(selected, { type: "geometry", polygons: [first] }).selectedId).toBe(
      first.id,
    );
  });

  it("clears the selection when the selected polygon goes away", () => {
    expect(drawReducer(selected, { type: "geometry", polygons: [second] }).selectedId).toBeNull();
    expect(drawReducer(selected, { type: "geometry", polygons: [] }).selectedId).toBeNull();
  });

  it("ignores a deselect for a feature that is not the current selection", () => {
    expect(drawReducer(selected, { type: "deselected", id: second.id })).toBe(selected);
    expect(drawReducer(selected, { type: "deselected", id: first.id }).selectedId).toBeNull();
  });
});

describe("terraDrawMode", () => {
  it("is static until the instance is bound", () => {
    expect(terraDrawMode({ ...INITIAL_DRAW_STATE, tool: "draw" })).toBe("static");
  });

  it("maps the tool onto a Terra Draw mode", () => {
    expect(terraDrawMode(bound)).toBe("static");
    expect(terraDrawMode({ ...bound, tool: "draw" })).toBe("polygon");
    expect(terraDrawMode({ ...bound, tool: "edit" })).toBe("select");
  });
});

describe("control availability", () => {
  it("enables nothing before the instance is bound", () => {
    const unbound: DrawState = { ...selected, bound: false };

    expect([canDraw(unbound), canEdit(unbound), canDelete(unbound), canClear(unbound)]).toEqual([
      false,
      false,
      false,
      false,
    ]);
  });

  it("allows drawing but nothing else with an empty map", () => {
    expect([canDraw(bound), canEdit(bound), canDelete(bound), canClear(bound)]).toEqual([
      true,
      false,
      false,
      false,
    ]);
  });

  it("allows editing and clearing once any polygon exists, deleting only with a selection", () => {
    expect([canEdit(drawn), canClear(drawn), canDelete(drawn)]).toEqual([true, true, false]);
    expect(canDelete(selected)).toBe(true);
  });
});
