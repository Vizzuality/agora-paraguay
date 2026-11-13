import { ClientOnly, Link } from '@tanstack/react-router';
import { useSetAtom } from 'jotai';

import { UserButton } from '@/components/auth/login-dialog';
import { AccountMenu } from '@/components/frame/account-menu';
import { Logo } from '@/components/logo';
import { useCurrentAnalysisType } from '@/components/settings/analysis-type-setting';
import { ThemeToggle, ThemeTogglePlaceholder } from '@/components/theme-toggle';
import { restartAtAreaAtom } from '@/store/settings';

/**
 * Logo on the left; theme switch and account on the right. Sits atop the settings column.
 * The logo is the first step: the área de interés open on the current riesgo (sanitario
 * from elsewhere), the selection map in the content column.
 */
export function TopBar() {
  const current = useCurrentAnalysisType();
  const restartAtArea = useSetAtom(restartAtAreaAtom);

  return (
    <header className="flex w-full items-center justify-between print:hidden">
      <Link
        to={current?.riesgo ? current.to : '/v2/sanitario'}
        aria-label="Inicio"
        onClick={() => restartAtArea()}
      >
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
