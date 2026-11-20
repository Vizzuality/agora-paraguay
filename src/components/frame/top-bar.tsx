import { ClientOnly, Link } from '@tanstack/react-router';
import { useSetAtom } from 'jotai';

import { AboutDialog } from '@/components/about-dialog';
import { UserButton } from '@/components/auth/login-dialog';
import { AccountMenu } from '@/components/frame/account-menu';
import { Logo } from '@/components/logo';
import { ThemeToggle, ThemeTogglePlaceholder } from '@/components/theme-toggle';
import { goHomeAtom } from '@/store/home';

/** Logo on the left; Acerca de, theme switch and account on the right. Sits atop the settings column. */
export function TopBar() {
  // Only written on a click, never read: safe outside `<ClientOnly>`.
  const goHome = useSetAtom(goHomeAtom);

  return (
    <header className="flex w-full items-center justify-between print:hidden">
      {/* Home is the landing: one card per analysis type. */}
      <Link to="/" aria-label="AGORA, inicio" onClick={() => goHome()}>
        <Logo className="h-6 w-auto text-primary" />
      </Link>

      <div className="flex items-center gap-2">
        <AboutDialog />
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
