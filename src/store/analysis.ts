import { atom } from 'jotai';

import type { FeatureId } from '@/lib/map/draw-features';
import { canSelectParcel } from '@/lib/map/draw-state';
import { polygonAtPoint, type MapPoint } from '@/lib/map/point-in-polygon';
import { drawInstanceAtom, drawStateAtom } from '@/store/draw-core';

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

  const previous = get(drawStateAtom).analysisId;

  set(drawStateAtom, { type: 'analysisSelected', id });

  // The selection is mirrored onto the feature itself so Terra Draw's style functions
  // can paint it (`draw-styles.ts`): a property change is a feature change, which is
  // what makes Terra Draw repaint — no imperative restyle call needed.
  const draw = get(drawInstanceAtom);

  if (!draw?.enabled) return;

  if (previous !== null && previous !== id && draw.getSnapshotFeature(previous)) {
    draw.updateFeatureProperties(previous, { analysis: undefined });
  }

  draw.updateFeatureProperties(id, { analysis: true });
});

/** Whether a map click currently picks a parcel. Drives the click handler and cursor. */
export const parcelClickEnabledAtom = atom((get) => canSelectParcel(get(drawStateAtom)));

/**
 * Map-click entry into the analysis selection: hit-tests the click against the store's
 * polygons and routes through `selectAnalysisPolygonAtom`, so a click on the map and a
 * click in the panel list are the same selection. A miss keeps the selection — the
 * panel offers no deselect either.
 */
export const selectParcelAtPointAtom = atom(null, (get, set, point: MapPoint) => {
  const state = get(drawStateAtom);

  if (!canSelectParcel(state)) return;

  const id = polygonAtPoint(state.polygons, point);

  if (id !== null) set(selectAnalysisPolygonAtom, id);
});

/**
 * Ends the session after a submitted analysis: parks the tool and stops the map-click
 * selection. The polygons stay on the map until a new session replaces them.
 */
export const endAnalysisSessionAtom = atom(null, (_get, set) => {
  set(drawStateAtom, { type: 'tool', tool: null });
  set(drawStateAtom, { type: 'analysisSubmitted' });
});
