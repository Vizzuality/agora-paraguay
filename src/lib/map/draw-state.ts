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

    // Terra Draw reports a change on every pointer move while a ring is in progress, with
    // the finished polygons unchanged: keeping the same state lets nothing re-render.
    case 'geometry':
      if (samePolygons(state.polygons, action.polygons)) return state;

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

/** Same ids in the same order, same rings and same properties. */
export function samePolygons(a: readonly DrawnPolygon[], b: readonly DrawnPolygon[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (polygon, index) =>
        polygon.id === b[index].id &&
        sameRings(polygon.geometry.coordinates, b[index].geometry.coordinates) &&
        sameProperties(polygon.properties, b[index].properties),
    )
  );
}

function sameRings(a: number[][][], b: number[][][]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (ring, r) =>
        ring.length === b[r].length &&
        ring.every((position, p) => position[0] === b[r][p][0] && position[1] === b[r][p][1]),
    )
  );
}

function sameProperties(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const keys = Object.keys(a);

  return keys.length === Object.keys(b).length && keys.every((key) => Object.is(a[key], b[key]));
}

/** The single place that decides which Terra Draw mode a given state means. */
export function terraDrawMode(state: DrawState): TerraDrawModeName {
  return state.bound && state.tool === 'draw' ? 'polygon' : 'static';
}
