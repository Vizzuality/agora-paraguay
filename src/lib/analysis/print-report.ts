import type { createStore } from 'jotai';

import { paperLayoutAtom, reportMapAtom } from '@/store/report';

type Store = ReturnType<typeof createStore>;

/** On the root while the print dialog is up: the page laid out at paper width (`globals.css`). */
export const PAPER_LAYOUT_CLASS = 'paper-layout';

/** How long the charts take to re-measure their cards: a resize observation plus their debounce. */
export const RELAYOUT_MS = 200;
/** The most the print waits for the map's image (its tiles may be loading). */
export const MAX_WAIT_MS = 3_000;

/**
 * Resolves once the report is ready to print: the mini map's image is in and the charts
 * have had their moment to re-measure — or the wait runs out, and the report goes
 * without the map rather than never.
 */
export function whenReportReady(store: Store): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      unsubscribe();
      clearTimeout(deadline);
      resolve();
    };
    const deadline = setTimeout(done, MAX_WAIT_MS);
    const unsubscribe = store.sub(reportMapAtom, () => {
      if (store.get(reportMapAtom) !== null) setTimeout(done, RELAYOUT_MS);
    });
  });
}

/**
 * Opens the browser's print dialog for the report. The document title is what the
 * browser proposes as the PDF's file name, so it is swapped for the report's and put back
 * once the dialog closes. The report is always light: the `dark` class comes off the root
 * for the dialog's lifetime, so the print stylesheet never has to restate the theme.
 *
 * Printing lays the page out for paper, narrower than the screen, but runs no script:
 * anything measured at runtime (the charts' widths) would keep its screen size, and the
 * map's canvas comes out blank. So the page is first laid out at paper width on screen
 * (`paperLayoutAtom`), the mini map renders itself to an image for the report, and the
 * dialog opens from there (`whenReportReady`). Browser only: called from a click handler
 * with the app's Jotai store, never during render.
 */
export function printReport(fileName: string, store: Store): void {
  const root = document.documentElement;
  const previousTitle = document.title;
  const wasDark = root.classList.contains('dark');

  const restore = () => {
    document.title = previousTitle;
    root.classList.remove(PAPER_LAYOUT_CLASS);
    if (wasDark) root.classList.add('dark');
    store.set(paperLayoutAtom, false);
    store.set(reportMapAtom, null);
    window.removeEventListener('afterprint', restore);
  };

  window.addEventListener('afterprint', restore);
  document.title = fileName;
  root.classList.remove('dark');
  root.classList.add(PAPER_LAYOUT_CLASS);
  store.set(reportMapAtom, null);
  store.set(paperLayoutAtom, true);
  void whenReportReady(store).then(() => window.print());
}
