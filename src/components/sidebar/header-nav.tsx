import { ClientOnly, Link, type LinkProps, useMatchRoute } from '@tanstack/react-router';
import { SquarePen } from 'lucide-react';

import { LoginDialog, UserButton } from '@/components/auth/login-dialog';
import { SelectionLink } from '@/components/selection-link';
import { ThemeToggle, ThemeTogglePlaceholder } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { RISK_TABS, SELECTION_LINK } from '@/lib/nav-links';
import { cn } from '@/lib/utils';

/**
 * The analysis nav bar's right side: the way back to the selection, the risk tabs,
 * the theme switch and the account. On a mobile device the first two do not fit
 * beside the logo and move to a row of their own under the bar (`PhoneAnalysisNav`):
 * `compact` leaves them out once the screen is known to be narrow, and the CSS hides
 * them before that, so they are never shown twice.
 */
export function HeaderNav({ compact = false }: Readonly<{ compact?: boolean }>) {
  return (
    <>
      {!compact && (
        <>
          <SelectionButton className="max-md:hidden" />
          <RiskTabs className="max-md:hidden" />
        </>
      )}

      <ClientOnly fallback={<ThemeTogglePlaceholder />}>
        <ThemeToggle />
      </ClientOnly>

      <ClientOnly fallback={<UserButton />}>
        <LoginDialog />
      </ClientOnly>
    </>
  );
}

/** The selection link and the risk tabs stacked full width under the mobile nav bar. */
export function PhoneAnalysisNav() {
  return (
    <div className="flex flex-col gap-2 p-2">
      <SelectionButton className="w-full" />
      <RiskTabs className="w-full" stretch />
    </div>
  );
}

function SelectionButton({ className }: Readonly<{ className?: string }>) {
  return (
    <Button
      asChild
      variant="secondary"
      className={cn('h-11 rounded-2xl px-8 font-normal text-accent-foreground', className)}
    >
      <SelectionLink>
        <SquarePen aria-hidden />
        {SELECTION_LINK.label}
      </SelectionLink>
    </Button>
  );
}

/** The two risk views as tabs; `stretch` shares the row between them (the mobile menu). */
function RiskTabs({
  className,
  stretch = false,
}: Readonly<{ className?: string; stretch?: boolean }>) {
  return (
    <div
      className={cn(
        'flex items-center gap-5 rounded-2xl bg-secondary px-6 py-1 text-sm',
        className,
      )}
    >
      {RISK_TABS.map(({ label, to }) => (
        <RiskTab key={label} to={to} className={cn(stretch && 'flex-1 text-center')}>
          {label}
        </RiskTab>
      ))}
    </div>
  );
}

/** A tab is a link to its riesgo's route; the router marks the matching one (`aria-current="page"`). */
function RiskTab({
  to,
  className,
  children,
}: Readonly<{ to: LinkProps['to']; className?: string; children: React.ReactNode }>) {
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
        className,
      )}
    >
      {children}
    </Link>
  );
}
