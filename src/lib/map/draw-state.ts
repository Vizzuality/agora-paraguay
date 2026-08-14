import type { DrawnPolygon, FeatureId } from "@/lib/map/draw-features";

/** What the user picked in the control cluster. `null` is idle: the map pans normally. */
export type DrawTool = "draw" | "edit";

/** The Terra Draw mode names this app registers, plus its built-in no-op mode. */
export type TerraDrawModeName = "polygon" | "select" | "static";

export type DrawState = {
  /** Terra Draw has started and its events are wired up. False during SSR and teardown. */
  bound: boolean;
  tool: DrawTool | null;
  /** Every finished polygon, in store order. Empty until the user draws one. */
  polygons: DrawnPolygon[];
  /** Selection is single: Terra Draw's select mode holds one feature at a time. */
  selectedId: FeatureId | null;
};

export type DrawAction =
  | { type: "bound" }
  | { type: "unbound" }
  | { type: "tool"; tool: DrawTool | null }
  | { type: "geometry"; polygons: DrawnPolygon[] }
  | { type: "selected"; id: FeatureId }
  | { type: "deselected"; id: FeatureId };

export const INITIAL_DRAW_STATE: DrawState = {
  bound: false,
  tool: null,
  polygons: [],
  selectedId: null,
};

export function drawReducer(state: DrawState, action: DrawAction): DrawState {
  switch (action.type) {
    case "bound":
      return { ...state, bound: true };

    // The instance owned the geometry: it went with the map, so nothing survives.
    case "unbound":
      return INITIAL_DRAW_STATE;

    case "tool":
      return {
        ...state,
        tool: action.tool,
        // Only select mode holds a selection, and Terra Draw does not promise a
        // `deselect` when the mode is swapped out from under it.
        selectedId: action.tool === "edit" ? state.selectedId : null,
      };

    case "geometry":
      return {
        ...state,
        polygons: action.polygons,
        // A selection outliving the polygon it points at would leave Delete enabled with
        // nothing to delete.
        selectedId: action.polygons.some((polygon) => polygon.id === state.selectedId)
          ? state.selectedId
          : null,
      };

    case "selected":
      return { ...state, selectedId: action.id };

    case "deselected":
      // A late deselect for a feature that is already gone must not clear a newer
      // selection.
      return state.selectedId === action.id ? { ...state, selectedId: null } : state;
  }
}

/** The single place that decides which Terra Draw mode a given state means. */
export function terraDrawMode(state: DrawState): TerraDrawModeName {
  if (!state.bound || state.tool === null) return "static";

  return state.tool === "draw" ? "polygon" : "select";
}

export function canDraw(state: DrawState): boolean {
  return state.bound;
}

export function canEdit(state: DrawState): boolean {
  return state.bound && state.polygons.length > 0;
}

export function canDelete(state: DrawState): boolean {
  return state.bound && state.selectedId !== null;
}

export function canClear(state: DrawState): boolean {
  return state.bound && state.polygons.length > 0;
}
