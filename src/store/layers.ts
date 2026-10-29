import { atom } from 'jotai';

/** The global layer shown on the map, by id; one at a time, `null` for none. */
export const activeGlobalLayerIdAtom = atom<number | null>(null);
