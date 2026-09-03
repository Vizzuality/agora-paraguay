import { describe, expect, it } from 'vitest';

import { resolveTheme, THEME_INIT_SCRIPT, THEME_STORAGE_KEY } from '@/lib/theme';

describe('resolveTheme', () => {
  it('prefers the stored theme over the OS preference', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('falls back to the OS preference when nothing valid is stored', () => {
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme(null, false)).toBe('light');
    expect(resolveTheme('sepia', true)).toBe('dark');
  });
});

describe('THEME_INIT_SCRIPT', () => {
  it('reads the same storage key the atom writes and toggles the .dark class', () => {
    expect(THEME_INIT_SCRIPT).toContain(`'${THEME_STORAGE_KEY}'`);
    expect(THEME_INIT_SCRIPT).toContain("classList.add('dark')");
    expect(THEME_INIT_SCRIPT).toContain('prefers-color-scheme: dark');
  });
});
