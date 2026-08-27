import { atom } from 'jotai';

import { drawStateAtom } from '@/store/draw-core';

/**
 * The app's two modes, as a tiny state machine:
 *
 *   'selection' — the user builds the set of areas of interest: drawing polygons,
 *                 uploading a file, or clicking cadastral parcels on the map.
 *   'analysis'  — entered when Analizar submits the areas. The selection freezes
 *                 (map clicks stop picking parcels) and the app shows /analisis.
 *
 * Transitions: `startAnalysisAtom` (selection → analysis, also parks the draw tool)
 * and `backToSelectionAtom` (analysis → selection, fired when `/` mounts again or a
 * new session starts). The selected areas themselves live in the draw store and
 * `selectedParcelsAtom`, and deliberately survive the transition in both directions.
 *
 * Lives on Jotai's default module store (SSR caveats on `draw-core.ts`): consumers
 * must render inside `<ClientOnly>`, and a hard reload always restarts in 'selection'.
 */
export type AppMode = 'selection' | 'analysis';

const appModeAtom = atom<AppMode>('selection');

/** Read-only view: the mode only changes through the transition atoms below. */
export const modeAtom = atom((get) => get(appModeAtom));

/** Analizar submitted: park the tool and freeze the selection. */
export const startAnalysisAtom = atom(null, (_get, set) => {
  set(drawStateAtom, { type: 'tool', tool: null });
  set(appModeAtom, 'analysis');
});

export const backToSelectionAtom = atom(null, (_get, set) => {
  set(appModeAtom, 'selection');
});
