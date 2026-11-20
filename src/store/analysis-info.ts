import { atom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';

/**
 * The analysis types whose info card the user closed, by label. Kept in localStorage, so a
 * closed card stays closed across pages, reloads and visits.
 */
export const dismissedAnalysisInfoAtom = atomWithStorage<string[]>(
  'agora:dismissed-analysis-info',
  [],
  // No localStorage outside a browser (server render, node tests): the atom keeps memory only.
  createJSONStorage<string[]>(() =>
    typeof localStorage === 'undefined' ? (undefined as unknown as Storage) : localStorage,
  ),
  { getOnInit: true },
);

/** Closes one analysis type's info card for good. */
export const dismissAnalysisInfoAtom = atom(null, (get, set, label: string) => {
  const dismissed = get(dismissedAnalysisInfoAtom);
  if (!dismissed.includes(label)) set(dismissedAnalysisInfoAtom, [...dismissed, label]);
});
