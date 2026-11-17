import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * The indicator widgets, as many as are selected — no empty frames. Auto-fill columns keep
 * every widget the same width whether it has company or not: at least 278px (two to the
 * analysis page's content column), never wider than the container, and as tall as its
 * text needs. `stacked` gives every widget the full width instead, as Todas does.
 */
export function WidgetGrid({
  stacked = false,
  children,
}: Readonly<{ stacked?: boolean; children?: ReactNode }>) {
  return (
    <div
      // The print stylesheet lays the widgets out by these (`globals.css`).
      data-slot="widget-grid"
      data-stacked={stacked || undefined}
      className={cn(
        'grid gap-4',
        stacked
          ? 'grid-cols-1'
          : 'grid-cols-[repeat(auto-fill,minmax(min(278px,100%),1fr))] print:grid-cols-2',
      )}
    >
      {children}
    </div>
  );
}
