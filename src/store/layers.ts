import { atom } from 'jotai';

/** The global layer shown on the map, by id; one at a time, `null` for none. */
export const activeGlobalLayerIdAtom = atom<number | null>(null);

/** Shows a layer, or hides it when it is the one already shown. */
export const toggleGlobalLayerAtom = atom(null, (get, set, id: number) => {
  set(activeGlobalLayerIdAtom, get(activeGlobalLayerIdAtom) === id ? null : id);
});
