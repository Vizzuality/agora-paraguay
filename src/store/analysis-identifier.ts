import { atomWithStorage, createJSONStorage } from 'jotai/utils';

/**
 * Identificador de análisis: the user's own reference for the analysis, free text. Kept in
 * sessionStorage, so it outlasts navigation and reloads for the tab's life; clearing the
 * parcel selection (Reiniciar, Borrar mapa: `clearSelectionAtom`) empties it.
 */
export const analysisIdentifierAtom = atomWithStorage(
  'agora:analysis-identifier',
  '',
  // No sessionStorage outside a browser (server render, node tests): the atom keeps memory only.
  createJSONStorage<string>(() =>
    typeof sessionStorage === 'undefined' ? (undefined as unknown as Storage) : sessionStorage,
  ),
  { getOnInit: true },
);
