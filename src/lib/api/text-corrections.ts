import corrections from '@/content/api-text-corrections.json';

/*
 * Temporary: the backend's copy as the platform should show it, until the backend fixes
 * it. The table lives in `src/content/api-text-corrections.json`: `exact` replaces a whole
 * value, `fragments` a part of one. Every entry matches only the wrong spelling, so once
 * the backend corrects a text its entry stops applying and can be deleted.
 */

const EXACT: Readonly<Record<string, string>> = corrections.exact;
const FRAGMENTS = Object.entries(corrections.fragments);

/** A name or label as it should read. */
export function correctApiText(text: string): string {
  const trimmed = text.trim();
  const exact = EXACT[trimmed];

  if (exact !== undefined) return exact;

  return FRAGMENTS.reduce((value, [wrong, right]) => value.replaceAll(wrong, right), trimmed);
}

/** A description as it should read, closed with a full stop when it lacks one. */
export function correctApiDescription(text: string): string {
  const corrected = correctApiText(text);

  return corrected === '' || /[.!?:]$/.test(corrected) ? corrected : `${corrected}.`;
}
