import { atom } from 'jotai';

import { restoreFeatures } from '@/lib/map/import-features';
import type { SavedSelection } from '@/lib/saved-selection';
import { selectAnalysisPolygonAtom } from '@/store/analysis';
import { drawInstanceAtom, drawStateAtom } from '@/store/draw-core';
import { restoreParcelTogglesAtom, toggledParcelIdsAtom } from '@/store/parcels';

/**
 * The bridge between the store and the saved selection (`src/lib/saved-selection.ts`).
 * Reading and writing the record is the hook's job (`useSavedSelection`); this file only
 * says what gets saved and how a saved record lands in the store.
 */

const hydratedBaseAtom = atom(false);

/**
 * Whether the saved record has been consulted this session. Nothing is written before
 * that: an effect firing on the empty initial state would otherwise wipe the record
 * before it was read.
 */
export const savedSelectionHydratedAtom = atom((get) => get(hydratedBaseAtom));

/** What survives a reload: the areas, the analysis pick, the parcel flips. */
export const savedSelectionAtom = atom<SavedSelection>((get) => {
  const { polygons, analysisId } = get(drawStateAtom);

  return { polygons, analysisId, toggledParcelIds: get(toggledParcelIdsAtom) };
});

/**
 * Lands the saved record in the store, once per session. If the user already has areas
 * on the map (they drew or uploaded before the read came back), theirs win and the record
 * is left to be overwritten by the next save. With Terra Draw already bound the polygons
 * go straight into it; otherwise `bindDrawAtom` picks them up from the store when it
 * binds, the same way it does after a visit to /analisis.
 */
export const hydrateSavedSelectionAtom = atom(null, (get, set, saved: SavedSelection | null) => {
  if (get(hydratedBaseAtom)) return;

  set(hydratedBaseAtom, true);

  if (saved === null || saved.polygons.length === 0) return;
  if (get(drawStateAtom).polygons.length > 0) return;

  const draw = get(drawInstanceAtom);
  const polygons = draw?.enabled ? restoreFeatures(draw, saved.polygons) : saved.polygons;

  set(drawStateAtom, { type: 'geometry', polygons });
  set(restoreParcelTogglesAtom, saved.toggledParcelIds);

  if (saved.analysisId !== null) set(selectAnalysisPolygonAtom, saved.analysisId);
});
