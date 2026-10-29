import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * The analysis pages' two columns: the controls (`side`) beside what they produce
 * (`children`), stacked under `lg` and in the report. From `lg` the side column stays in
 * view while the page scrolls (sticky, 40px from the top); one taller than the window is
 * capped at it and scrolls on its own, so its bottom (the filters, Personalizar) stays
 * reachable.
 * `stretch` makes the content column at least as tall as the side one, for a panel that
 * should line up with it (Exposición climática's district box beside the map); the side
 * column keeps its own height, so it still sticks.
 */
export function AnalysisShell({
  side,
  children,
  stretch = false,
}: Readonly<{ side: ReactNode; children: ReactNode; stretch?: boolean }>) {
  return (
    <div
      className={cn(
        'grid gap-4 lg:grid-cols-2 print:flex print:flex-col print:gap-6 paper:flex paper:flex-col paper:gap-6',
        stretch ? 'lg:items-stretch' : 'lg:items-start',
      )}
    >
      {/* Its own height (`self-start`) even when the row stretches: a column as tall as the row has no room to stick. */}
      <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-10 lg:max-h-[calc(100dvh-5rem)] lg:self-start lg:overflow-y-auto print:static print:max-h-none print:gap-6 print:overflow-visible paper:static paper:max-h-none paper:gap-6 paper:overflow-visible">
        {side}
      </div>
      <div className="flex min-w-0 flex-col gap-4">{children}</div>
    </div>
  );
}
