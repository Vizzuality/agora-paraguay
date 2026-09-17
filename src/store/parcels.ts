import { atom } from 'jotai';

import { toggleParcelId } from '@/lib/map/parcel-selection';
import { drawStateAtom } from '@/store/draw-core';
import { modeAtom } from '@/store/mode';

/**
 * The user's manual refinement of the parcels `filter_parcels` answered for the drawn
 * areas: the ids whose `selected` flag is flipped, applied on read by the map layer and
 * by Analizar (`applyToggles`). Kept apart from the query cache on purpose — the answer
 * belongs to the API, the flips to the session.
 */
const toggledParcelIdsBaseAtom = atom<number[]>([]);

export const toggledParcelIdsAtom = atom((get) => get(toggledParcelIdsBaseAtom));

/**
 * Whether a map click currently flips a parcel: selection mode only (Analizar freezes
 * it) and only while no draw tool is active, since in draw mode a click places a vertex.
 */
export const parcelClickEnabledAtom = atom((get) => {
  const draw = get(drawStateAtom);

  return get(modeAtom) === 'selection' && draw.bound && draw.tool === null;
});

/** Flips one returned parcel. The single gate: routes through `parcelClickEnabledAtom`. */
export const toggleParcelAtom = atom(null, (get, set, id: number) => {
  if (!get(parcelClickEnabledAtom)) return;

  set(toggledParcelIdsBaseAtom, toggleParcelId(get(toggledParcelIdsBaseAtom), id));
});

/** A new selection session starts from the API's own flags again. */
export const resetParcelTogglesAtom = atom(null, (_get, set) => {
  set(toggledParcelIdsBaseAtom, []);
});
