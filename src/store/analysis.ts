import { atom } from 'jotai';

import type { FeatureId } from '@/lib/map/draw-features';
import { canSelectParcel } from '@/lib/map/draw-state';
import { drawInstanceAtom, drawStateAtom } from '@/store/draw-core';
import { modeAtom } from '@/store/mode';

/**
 * The polygon picked for analysis — app-owned, unlike Terra Draw's edit selection,
 * which only lives while the edit tool is active. Picking a farm to analyse must not
 * require entering edit mode, where drags mutate geometry.
 *
 * `analysisId` itself lives in the draw reducer (`draw-state.ts`) so that deleting or
 * clearing a polygon prunes the selection in the same action that removes it. The
 * selection session's start and end (Analizar) live in `mode.ts`.
 */

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

/** The parcel tab open on the analysis page — an index into the submitted area list. */
export const activeParcelTabAtom = atom(0);

/**
 * Whether a map click currently picks a parcel. Drives the click handler and cursor.
 * Selection mode only — Analizar freezes it — and only while the map is idle
 * (`canSelectParcel`). The single gate: `toggleParcelAtom` routes through it too.
 */
export const parcelClickEnabledAtom = atom(
  (get) => get(modeAtom) === 'selection' && canSelectParcel(get(drawStateAtom)),
);
