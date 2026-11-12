import { Link, useMatchRoute } from '@tanstack/react-router';

import { ANALYSIS_TYPES } from '@/lib/nav-links';
import { cn } from '@/lib/utils';

/** The analysis type the open route shows, or `undefined` off the analysis routes. */
export function useCurrentAnalysisType() {
  const matchRoute = useMatchRoute();

  return ANALYSIS_TYPES.find(({ to }) => matchRoute({ to }) !== false);
}

/**
 * Tipo de análisis: one card per type, each a link to its route, the open one outlined.
 * The type stays the route, so a shared link lands on it.
 */
export function AnalysisTypeSetting({ onChoose }: Readonly<{ onChoose?: () => void }>) {
  const current = useCurrentAnalysisType();

  return (
    <nav aria-label="Tipo de análisis" className="grid grid-cols-3 gap-1.5 max-md:grid-cols-1">
      {ANALYSIS_TYPES.map(({ label, to, icon: Icon }) => {
        const active = current?.to === to;

        return (
          <Link
            key={label}
            to={to}
            // Switching types must not stack history entries, like the old header tabs.
            replace
            onClick={onChoose}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center justify-center gap-2.5 rounded-2xl bg-secondary p-8 text-center text-sm transition-colors hover:bg-secondary-hover max-md:flex-row max-md:p-4',
              active
                ? 'border-3 border-primary text-primary'
                : 'border border-border text-accent-foreground',
            )}
          >
            <Icon aria-hidden className="size-10 shrink-0 max-md:size-6" strokeWidth={1.5} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
