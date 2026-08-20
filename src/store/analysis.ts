import { atom } from "jotai";

import type { FeatureId } from "@/lib/map/draw-features";
import { drawStateAtom } from "@/store/draw-core";

/**
 * The polygon picked for analysis — app-owned, unlike Terra Draw's edit selection,
 * which only lives while the edit tool is active. Picking a farm to analyse must not
 * require entering edit mode, where drags mutate geometry.
 *
 * `analysisId` itself lives in the draw reducer (`draw-state.ts`) so that deleting or
 * clearing a polygon prunes the selection in the same action that removes it.
 */

/** The polygon picked for analysis, resolved to its feature. `null` when none is. */
export const analysisPolygonAtom = atom((get) => {
  const { polygons, analysisId } = get(drawStateAtom);

  return polygons.find((polygon) => polygon.id === analysisId) ?? null;
});

export const selectAnalysisPolygonAtom = atom(null, (get, set, id: FeatureId) => {
  // A stale id — the polygon was deleted while the click was in flight — selects nothing.
  if (!get(drawStateAtom).polygons.some((polygon) => polygon.id === id)) return;

  set(drawStateAtom, { type: "analysisSelected", id });
});
