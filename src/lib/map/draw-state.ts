import type { DrawnPolygon, FeatureId } from '@/lib/map/draw-features';

/** What the user picked in the panel. `null` is idle: the map pans normally. */
export type DrawTool = 'draw';

/** The Terra Draw mode names this app registers, plus its built-in no-op mode. */
export type TerraDrawModeName = 'polygon' | 'static';

export type DrawState = {
  /** Terra Draw has started and its events are wired up. False during SSR and teardown. */
  bound: boolean;
  tool: DrawTool | null;
  /** Every finished polygon, in store order. Empty until the user draws one. */
  polygons: DrawnPolygon[];
  /**
   * The polygon picked for analysis — app-owned. Picking a farm to analyse happens in
   * the panel list, without mutating geometry.
   */
  analysisId: FeatureId | null;
};

export type DrawAction =
  | { type: 'bound' }
  | { type: 'unbound' }
  | { type: 'tool'; tool: DrawTool | null }
  | { type: 'geometry'; polygons: DrawnPolygon[] }
  | { type: 'analysisSelected'; id: FeatureId }
  | { type: 'analysisCleared' };

export const INITIAL_DRAW_STATE: DrawState = {
  bound: false,
  tool: null,
  polygons: [],
  analysisId: null,
};

export function drawReducer(state: DrawState, action: DrawAction): DrawState {
  switch (action.type) {
    case 'bound':
      return { ...state, bound: true };

    // The instance goes with the map, but the finished polygons are plain GeoJSON the
    // app owns — they survive the unmount so the selection is still there after
    // /analisis, and `bindDrawAtom` re-imports them into the next instance. Everything
    // tied to the live instance (bound, the active tool) resets. `analysisId` survives
    // with the polygons it points into.
    case 'unbound':
      return {
        ...INITIAL_DRAW_STATE,
        polygons: state.polygons,
        analysisId: state.analysisId,
      };

    case 'tool':
      return { ...state, tool: action.tool };

    case 'geometry':
      return {
        ...state,
        polygons: action.polygons,
        // An analysis selection outliving the polygon it points at would highlight
        // nothing.
        analysisId: action.polygons.some((polygon) => polygon.id === state.analysisId)
          ? state.analysisId
          : null,
      };

    // The analysis selection survives tool changes: it is not tied to any Terra Draw
    // mode.
    case 'analysisSelected':
      return { ...state, analysisId: action.id };

    case 'analysisCleared':
      return { ...state, analysisId: null };
  }
}

/** The single place that decides which Terra Draw mode a given state means. */
export function terraDrawMode(state: DrawState): TerraDrawModeName {
  return state.bound && state.tool === 'draw' ? 'polygon' : 'static';
}

/**
 * Whether the map is idle enough for a click to mean "pick a parcel". Only while no
 * tool is active: in draw mode a click places a vertex. The app-mode gate (selection
 * vs analysis) lives in `parcelClickEnabledAtom`, which combines this with `modeAtom`.
 */
export function canSelectParcel(state: DrawState): boolean {
  return state.bound && state.tool === null;
}
