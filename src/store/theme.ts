import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import { resolveTheme, THEME_STORAGE_KEY, type Theme } from '@/lib/theme';

/**
 * Light or dark, persisted in localStorage under the key the root's inline script
 * reads. Server render falls back to light — consumers sit inside `<ClientOnly>` like
 * every other atom user, so that value never reaches the DOM.
 */
export const themeAtom = atomWithStorage<Theme>(THEME_STORAGE_KEY, initialTheme(), undefined, {
  getOnInit: true,
});

/** Flips the theme and applies it: the `.dark` class on <html> is what the tokens key on. */
export const toggleThemeAtom = atom(null, (get, set) => {
  const next: Theme = get(themeAtom) === 'dark' ? 'light' : 'dark';

  document.documentElement.classList.toggle('dark', next === 'dark');
  set(themeAtom, next);
});

function initialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';

  return resolveTheme(
    window.localStorage.getItem(THEME_STORAGE_KEY),
    window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
}
