import { useSyncExternalStore } from 'react';

/** Below Tailwind's `md` breakpoint (48rem), where the CSS switches to the phone layout. */
const NARROW_SCREEN = '(width < 48rem)';

function subscribe(onChange: () => void) {
  const query = window.matchMedia(NARROW_SCREEN);

  query.addEventListener('change', onChange);

  return () => query.removeEventListener('change', onChange);
}

/**
 * Whether the viewport is narrower than `md`. False on the server and before hydration,
 * matching the wide layout the CSS paints first; the phone-only pieces mount once it
 * flips, so a control never exists twice in the DOM (once visible, once hidden).
 */
export function useNarrowScreen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(NARROW_SCREEN).matches,
    () => false,
  );
}
