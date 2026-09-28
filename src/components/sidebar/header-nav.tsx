import { ClientOnly, Link, type LinkProps, useMatchRoute } from '@tanstack/react-router';
import { SquarePen } from 'lucide-react';

import { LoginDialog, UserButton } from '@/components/auth/login-dialog';
import { SelectionLink } from '@/components/selection-link';
import { ThemeToggle, ThemeTogglePlaceholder } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { RISK_TABS, SELECTION_LINK } from '@/lib/nav-links';
import { cn } from '@/lib/utils';

export function HeaderNav() {
  return (
    <>
      <Button
        asChild
        variant="secondary"
        className="h-11 rounded-2xl px-8 font-normal text-accent-foreground"
      >
        <SelectionLink>
          <SquarePen aria-hidden />
          {SELECTION_LINK.label}
        </SelectionLink>
      </Button>

      <div className="flex items-center gap-5 rounded-2xl bg-secondary px-6 py-1 text-sm">
        {RISK_TABS.map(({ label, to }) => (
          <RiskTab key={label} to={to}>
            {label}
          </RiskTab>
        ))}
      </div>

      <ClientOnly fallback={<ThemeTogglePlaceholder />}>
        <ThemeToggle />
      </ClientOnly>

      <ClientOnly fallback={<UserButton />}>
        <LoginDialog />
      </ClientOnly>
    </>
  );
}

/** A tab is a link to its riesgo's route; the router marks the matching one (`aria-current="page"`). */
function RiskTab({ to, children }: Readonly<{ to: LinkProps['to']; children: React.ReactNode }>) {
  // Not `activeProps`: the router joins its className with the base one as plain strings,
  // so `cn` could not resolve the two text colours.
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
