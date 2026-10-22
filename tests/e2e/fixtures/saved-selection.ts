import type { Page } from '@playwright/test';

/**
 * How many entries one list of the saved selection record holds in the page's
 * IndexedDB, 0 when there is no record. The app saves 250 ms after the last change, so a
 * reload test polls this before reloading; otherwise the reload can land first and
 * nothing is restored. Names mirror `src/lib/saved-selection.ts`.
 */
function savedListLength(page: Page, list: 'polygons' | 'analysedParcelIds'): Promise<number> {
  return page.evaluate(
    (key) =>
      new Promise<number>((resolve) => {
        const request = indexedDB.open('parcels', 1);

        // No database yet: abort, or this probe would create it without the app's store.
        request.onupgradeneeded = () => request.transaction?.abort();
        request.onerror = () => resolve(0);
        request.onsuccess = () => {
          const database = request.result;
          const read = database
            .transaction('selection', 'readonly')
            .objectStore('selection')
            .get('current');

          read.onsuccess = () => {
            database.close();
            resolve(read.result?.[key]?.length ?? 0);
          };
          read.onerror = () => {
            database.close();
            resolve(0);
          };
        };
      }),
    list,
  );
}

export function savedPolygonCount(page: Page): Promise<number> {
  return savedListLength(page, 'polygons');
}

export function savedAnalysedParcelCount(page: Page): Promise<number> {
  return savedListLength(page, 'analysedParcelIds');
}
