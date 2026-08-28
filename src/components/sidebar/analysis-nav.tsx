import { getRouteApi, Link } from '@tanstack/react-router';
import { SquarePen, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RiesgoTab } from '@/routes/analisis';

const analisisRoute = getRouteApi('/analisis');

/**
 * Right-hand navbar content for the analysis page (Figma node 5180:12072): a link
 * back to the parcel selection, the risk tabs, and the login entry point.
 *
 * The tabs switch the page content through the `riesgo` search param — URL state on
 * purpose, so a shared or reloaded link lands on the same tab. Login is scaffolding:
 * it goes nowhere until the auth flow lands.
 */
export function AnalysisNav() {
  const { riesgo } = analisisRoute.useSearch();

  return (
    <>
      <Button
        asChild
        variant="secondary"
        className="h-11 rounded-2xl px-8 font-normal text-accent-foreground"
      >
        <Link to="/seleccion">
          <SquarePen aria-hidden />
          Selección de parcelas
        </Link>
      </Button>

      <div className="flex items-center gap-5 rounded-2xl bg-secondary px-6 py-1 text-sm">
        <RiskTab riesgo="sanitario" active={riesgo === 'sanitario'}>
          Riesgo sanitario
        </RiskTab>
        <RiskTab riesgo="productivo" active={riesgo === 'productivo'}>
          Riesgo productivo
        </RiskTab>
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

/** One tab in the pill: the current one carries the design's primary underline. */
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
