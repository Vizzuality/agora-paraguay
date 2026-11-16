import { ClientOnly, Link, type LinkProps, useMatchRoute } from '@tanstack/react-router';

import { LoginDialog, UserButton } from '@/components/auth/login-dialog';
import { ThemeToggle, ThemeTogglePlaceholder } from '@/components/theme-toggle';
import { HEADER_TABS } from '@/lib/nav-links';
import { cn } from '@/lib/utils';

/** The nav bar's right side on the pages outside the redesign: the analysis tabs, the theme switch and the account. */
export function HeaderNav() {
  return (
    <>
      <HeaderTabs className="max-md:hidden" />

      <ClientOnly fallback={<ThemeTogglePlaceholder />}>
        <ThemeToggle />
      </ClientOnly>

      <ClientOnly fallback={<UserButton />}>
        <LoginDialog />
      </ClientOnly>
    </>
  );
}

/** The section tabs (`HEADER_TABS`). */
function HeaderTabs({ className }: Readonly<{ className?: string }>) {
  return (
    <div
      className={cn(
        'flex items-center gap-5 rounded-2xl bg-secondary px-6 py-1 text-sm',
        className,
      )}
    >
      {HEADER_TABS.map(({ label, to }) => (
        <RiskTab key={label} to={to}>
          {label}
        </RiskTab>
      ))}
    </div>
  );
}

/** A tab is a link to its section's route; the router marks the matching one (`aria-current="page"`). */
function RiskTab({ to, children }: Readonly<{ to: LinkProps['to']; children: React.ReactNode }>) {
  const matchRoute = useMatchRoute();
  const active = matchRoute({ to }) !== false;

  return (
    <Link
      to={to}
      // Like the camera params: switching tabs must not stack history entries, or
      // the browser's Back stops leaving the page.
      replace
      className={cn(
        'py-2 text-accent-foreground',
        active && 'border-b-3 border-primary text-primary',
      )}
    >
      {children}
    </Link>
  );
}
