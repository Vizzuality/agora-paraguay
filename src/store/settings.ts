import { atom } from 'jotai';

import { backToSelectionAtom } from '@/store/mode';

const settingsRestartsAtom = atom(0);

/** Bumped on every restart: the sidebar keys its sections by it, so they start afresh. */
export const settingsRestartCountAtom = atom((get) => get(settingsRestartsAtom));

/**
 * The logo's first step: back to the selection with the parcels kept (as Editar
 * parcelas), the sections reset so the área de interés opens.
 */
export const restartAtAreaAtom = atom(null, (_get, set) => {
  set(backToSelectionAtom);
  set(settingsRestartsAtom, (count) => count + 1);
});
