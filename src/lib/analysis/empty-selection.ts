import { EXPOSURE_TAB } from '@/lib/nav-links';

/**
 * Whether an analysis page with nothing analysed sends the user back to the selection.
 * Only the riesgo pages read parcels; Exposición climática works by district, so it
 * stands on its own whatever the selection holds.
 */
export function sendsBackToSelection({
  pathname,
  hydrated,
  parcelCount,
}: Readonly<{ pathname: string; hydrated: boolean; parcelCount: number }>): boolean {
  if (pathname.replace(/\/+$/, '') === EXPOSURE_TAB.to) return false;

  // Before the saved selection is read, an empty store says nothing yet.
  return hydrated && parcelCount === 0;
}
