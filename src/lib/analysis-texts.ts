import texts from '@/content/analysis-texts.json';

/** The analysis pages' explanatory copy, edited in `src/content/analysis-texts.json`. */
export const ANALYSIS_TEXTS = texts;

/** The info card's text for the page at `path`, or `undefined` off the analysis pages. */
export function infoCardText(path: string): string | undefined {
  return (ANALYSIS_TEXTS.infoCards as Record<string, string>)[path];
}

export type TextSegment = { text: string; strong: boolean };

/** Splits a paragraph on `**…**` so the copy can mark its bold runs in plain JSON. */
export function splitStrong(paragraph: string): TextSegment[] {
  return paragraph
    .split('**')
    .map((text, index) => ({ text, strong: index % 2 === 1 }))
    .filter(({ text }) => text !== '');
}
