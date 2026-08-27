import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

/**
 * Session-only theme switch: applies the `.dark` class on <html> so the token
 * overrides in globals.css take effect. No persistence on purpose — a durable
 * theming decision (storage + FOUC script in __root) comes later if needed.
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  function toggleTheme() {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    setIsDark(next);
  }

  return (
    <Button variant="ghost" size="icon" aria-label="Cambiar tema" onClick={toggleTheme}>
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}
