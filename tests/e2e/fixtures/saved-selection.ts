import type { Page } from '@playwright/test';

/**
 * How many polygons the saved selection record holds in the page's IndexedDB, 0 when
 * there is none. The app saves 250 ms after the last change, so a reload test polls this
 * before reloading; otherwise the reload can land first and nothing is restored.
 * Names mirror `src/lib/saved-selection.ts`.
 */
export function savedPolygonCount(page: Page): Promise<number> {
  return page.evaluate(
    () =>
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
            resolve(read.result?.polygons?.length ?? 0);
          };
          read.onerror = () => {
            database.close();
            resolve(0);
          };
        };
      }),
  );
}
