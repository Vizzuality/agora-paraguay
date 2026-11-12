import type { ReactNode } from 'react';

import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

/** The analysis results; while a re-run replaces them, disabled under a centred notice. */
export function AnalysisPanel({
  busy,
  children,
}: Readonly<{ busy: boolean; children: ReactNode }>) {
  return (
    <div aria-busy={busy} className={cn('relative', busy && 'cursor-not-allowed')}>
      <div
        inert={busy}
        className={cn(
          'flex flex-col gap-4 transition-[opacity,filter]',
          busy && 'opacity-50 grayscale',
        )}
      >
        {children}
      </div>
      {busy && (
        <div className="absolute inset-0 flex justify-center print:hidden">
          <output className="sticky top-1/3 mt-16 flex h-fit items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-medium text-foreground shadow-md">
            <Spinner />
            Actualizando análisis…
          </output>
        </div>
      )}
    </div>
  );
}
