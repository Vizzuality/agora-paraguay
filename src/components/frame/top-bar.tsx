import { ClientOnly, Link } from '@tanstack/react-router';
import { useSetAtom } from 'jotai';

import { UserButton } from '@/components/auth/login-dialog';
import { AccountMenu } from '@/components/frame/account-menu';
import { Logo } from '@/components/logo';
import { ThemeToggle, ThemeTogglePlaceholder } from '@/components/theme-toggle';
import { startOverAtom } from '@/store/home';

/** Logo on the left; theme switch and account on the right. Sits atop the settings column. */
export function TopBar() {
  // Only written on a click, never read: safe outside `<ClientOnly>`.
  const startOver = useSetAtom(startOverAtom);

  return (
    <header className="flex w-full items-center justify-between print:hidden">
      {/* Home is the initial state: Riesgo sanitario, nothing drawn, default camera. */}
      <Link to="/" aria-label="Inicio" onClick={() => startOver()}>
        <Logo className="h-[30px] w-auto text-primary" />
      </Link>

      <div className="flex items-center gap-2">
        <ClientOnly fallback={<ThemeTogglePlaceholder />}>
          <ThemeToggle />
        </ClientOnly>
        <ClientOnly fallback={<UserButton />}>
          <AccountMenu />
        </ClientOnly>
      </div>
    </header>
  );
}
