import type { ReactNode } from 'react';

/**
 * The analysis pages' two columns: the controls (`side`) beside what they produce
 * (`children`), stacked under `lg` and in the report. The side column follows the
 * scroll only on a screen tall enough to show all of it — a sticky column taller than
 * the viewport would hide its own bottom (the filters, Personalizar) until the page ends.
 */
export function AnalysisShell({
  side,
  children,
}: Readonly<{ side: ReactNode; children: ReactNode }>) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start print:flex print:flex-col print:gap-6 paper:flex paper:flex-col paper:gap-6">
      <div className="flex min-w-0 flex-col gap-4 lg:top-10 print:gap-6 paper:gap-6 lg:[@media(min-height:50rem)]:sticky">
        {side}
      </div>
      <div className="flex min-w-0 flex-col gap-4">{children}</div>
    </div>
  );
}
