export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'agora-theme';

/** A stored value wins; otherwise the OS preference. Anything unrecognised is ignored. */
export function resolveTheme(stored: unknown, prefersDark: boolean): Theme {
  if (stored === 'light' || stored === 'dark') return stored;

  return prefersDark ? 'dark' : 'light';
}

/**
 * Runs inline in <head> before first paint, so a dark user never sees a light flash.
 * Mirrors `resolveTheme` — keep the two in step. Wrapped in try/catch because
 * `localStorage` throws in some privacy modes.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('${THEME_STORAGE_KEY}');var d=s==='dark'||(s!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;
