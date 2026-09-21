import { atom } from 'jotai';

import { selectionStep } from '@/lib/selection-steps';
import { drawInstanceAtom, drawStateAtom } from '@/store/draw-core';
import { resetParcelTogglesAtom } from '@/store/parcels';

/** The panel step, derived: the store never holds it, so it cannot drift from the areas. */
export const selectionStepAtom = atom((get) => {
  const draw = get(drawStateAtom);

  return selectionStep({ areaCount: draw.polygons.length, drawing: draw.tool === 'draw' });
});

/**
 * `filter-parcels` answered with nothing for the areas (outside the cadastre's coverage).
 * The areas are gone from the map; the panel shows the backend's reason (Figma 7288:2099)
 * and outlines the entry point that brought them (7288:2096) until dismissed.
 */
export type AreaRejection = { source: 'draw' | 'upload'; message: string };

export const areaRejectionAtom = atom<AreaRejection | null>(null);

/**
 * Rejects the areas on the map: clears them (back to step 1, the parcels query goes
 * idle with them) and records why. The source is the first area's origin — an upload
 * marks its features, a drawing does not.
 */
export const rejectAreasAtom = atom(null, (get, set, message: string) => {
  const draw = get(drawInstanceAtom);
  const { polygons } = get(drawStateAtom);

  if (polygons.length === 0) return;

  const source = polygons[0].properties.origin === 'upload' ? 'upload' : 'draw';

  if (draw?.enabled) {
    // Disarm before clearing: stopping polygon mode sweeps an in-progress ring.
    set(drawStateAtom, { type: 'tool', tool: null });
    draw.clear();
  }

  // `clear()` does not surface as a `change` event, so report it by hand.
  set(drawStateAtom, { type: 'geometry', polygons: [] });
  set(resetParcelTogglesAtom);
  set(areaRejectionAtom, { source, message });
});
