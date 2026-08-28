import { getRouteApi, Link } from '@tanstack/react-router';
import { SquarePen, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { RISK_TABS, SELECTION_LINK } from '@/lib/nav-links';
import { cn } from '@/lib/utils';
import type { RiesgoTab } from '@/routes/analisis';

const analisisRoute = getRouteApi('/analisis');

export function AnalysisNav() {
  const { riesgo } = analisisRoute.useSearch();

  return (
    <>
      <Button
        asChild
        variant="secondary"
        className="h-11 rounded-2xl px-8 font-normal text-accent-foreground"
      >
        <Link to={SELECTION_LINK.to}>
          <SquarePen aria-hidden />
          {SELECTION_LINK.label}
        </Link>
      </Button>

      <div className="flex items-center gap-5 rounded-2xl bg-secondary px-6 py-1 text-sm">
        {RISK_TABS.map(({ label, riesgo: tab }) => (
          <RiskTab key={tab} riesgo={tab} active={riesgo === tab}>
            {label}
          </RiskTab>
        ))}
      </div>

      <Button
        variant="secondary"
        className="size-12 rounded-full text-accent-foreground [&_svg:not([class*='size-'])]:size-6"
        aria-label="Iniciar sesión"
      >
        <User aria-hidden />
      </Button>
    </>
  );
}

function RiskTab({
  riesgo,
  active,
  children,
}: Readonly<{ riesgo: RiesgoTab; active: boolean; children: React.ReactNode }>) {
  return (
    <Link
      to="/analisis"
      search={{ riesgo }}
      // Like the camera params: switching tabs must not stack history entries, or
      // the browser's Back stops leaving the page.
      replace
      aria-current={active ? 'page' : undefined}
      className={cn(
        'py-2 text-accent-foreground',
        active && 'border-b-3 border-primary text-primary',
      )}
    >
      {children}
    </Link>
  );
}
