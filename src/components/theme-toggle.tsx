import { useAtomValue, useSetAtom } from 'jotai';
import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { themeAtom, toggleThemeAtom } from '@/store/theme';

/**
 * The header's light/dark switch (Figma "Mode selector"): a 48px round secondary
 * button showing the theme it switches to. Reads the theme atom, so render it inside
 * `<ClientOnly>` with `<ThemeTogglePlaceholder />` as the fallback.
 */
export function ThemeToggle() {
  const isDark = useAtomValue(themeAtom) === 'dark';
  const toggle = useSetAtom(toggleThemeAtom);

  return (
    <ThemeToggleButton aria-pressed={isDark} onClick={toggle}>
      {isDark ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </ThemeToggleButton>
  );
}

/** Same footprint before hydration, so the header does not shift when the real one mounts. */
export function ThemeTogglePlaceholder() {
  return (
    <ThemeToggleButton disabled>
      <Moon aria-hidden />
    </ThemeToggleButton>
  );
}

function ThemeToggleButton(props: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="secondary"
      className="size-12 rounded-full text-accent-foreground [&_svg:not([class*='size-'])]:size-6"
      aria-label="Cambiar tema"
      {...props}
    />
  );
}
