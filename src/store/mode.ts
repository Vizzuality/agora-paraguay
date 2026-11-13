import { atom } from 'jotai';

import { analysedParcelIdsAtom } from '@/store/analysis';
import { drawStateAtom } from '@/store/draw-core';

/**
 * The app's two modes, as a tiny state machine:
 *
 *   'selection' — the user builds the set of areas of interest: drawing polygons or
 *                 uploading a file.
 *   'analysis'  — entered when Analizar submits the areas. The selection freezes and
 *                 the app shows /analisis.
 *
 * Transitions: `startAnalysisAtom` (selection → analysis, also parks the draw tool)
 * and `backToSelectionAtom` (analysis → selection, fired when `/` mounts again or a
 * new session starts). The selected areas themselves live in the draw store and
 * deliberately survive the transition in both directions.
 *
 * Lives on Jotai's default module store (SSR caveats on `draw-core.ts`): consumers
 * must render inside `<ClientOnly>`, and a hard reload always restarts in 'selection'.
 */
export type AppMode = 'selection' | 'analysis';

const appModeAtom = atom<AppMode>('selection');

/** Read-only view: the mode only changes through the transition atoms below. */
export const modeAtom = atom((get) => get(appModeAtom));

/** Analizar submitted: park the tool, record the parcels it sends, freeze the selection. */
export const startAnalysisAtom = atom(null, (_get, set, parcelIds: string[]) => {
  set(drawStateAtom, { type: 'tool', tool: null });
  set(analysedParcelIdsAtom, parcelIds);
  set(appModeAtom, 'analysis');
});

export const backToSelectionAtom = atom(null, (_get, set) => {
  set(appModeAtom, 'selection');
});

/**
 * The redesign shows the analysis in place of the selection map (no `/analisis` to land
 * on): analysing, with parcels analysed. Editar parcelas (`backToSelectionAtom`) flips it
 * back with the parcels kept.
 */
export const analysedViewAtom = atom(
  (get) => get(appModeAtom) === 'analysis' && get(analysedParcelIdsAtom).length > 0,
);

/**
 * A reload starts in 'selection' with the analysed parcels restored from disk: resume
 * the analysis they were. The redesign's layout calls it once the saved record is read.
 */
export const resumeAnalysisAtom = atom(null, (get, set) => {
  const parcelIds = get(analysedParcelIdsAtom);

  if (get(appModeAtom) === 'selection' && parcelIds.length > 0) set(startAnalysisAtom, parcelIds);
});
