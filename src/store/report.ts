import { atom } from 'jotai';

/*
 * The report (the analysis page printed, `printReport`) needs the page prepared before
 * the print dialog opens: laid out at paper width, and the mini map — a WebGL canvas,
 * which prints blank — rendered to an image.
 */

/** True from Exportar informe until the print dialog closes: the page is laid out for paper. */
export const paperLayoutAtom = atom(false);

/** The mini map as a PNG data URL for the report; `null` until taken for this print. */
export const reportMapAtom = atom<string | null>(null);
