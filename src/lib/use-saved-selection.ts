import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';

import { readSavedSelection, writeSavedSelection } from '@/lib/saved-selection';
import {
  hydrateSavedSelectionAtom,
  savedSelectionAtom,
  savedSelectionHydratedAtom,
} from '@/store/saved-selection';

/** A vertex drag reports geometry on every move; one write per pause is plenty. */
const SAVE_DELAY_MS = 250;

/**
 * Keeps the selection on disk across reloads: reads the saved record once when the
 * selection page mounts and hands it to the store, then saves the store's selection
 * whenever it changes. Rendered inside `<ClientOnly>` on `/`: it reads atoms, and
 * IndexedDB only exists in the browser.
 */
export function useSavedSelection() {
  const hydrated = useAtomValue(savedSelectionHydratedAtom);
  const hydrate = useSetAtom(hydrateSavedSelectionAtom);
  const selection = useAtomValue(savedSelectionAtom);

  useEffect(() => {
    // Not cancelled on unmount: the store is module-wide, and hydrating is idempotent.
    void readSavedSelection().then(hydrate);
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;

    const timer = setTimeout(() => void writeSavedSelection(selection), SAVE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [hydrated, selection]);
}
