import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * The indicator cards, as many as are selected — no empty frames. Auto-fill columns keep
 * every card the same width whether it has company or not: at least 278px (two to the
 * analysis page's content column), never wider than the container, and as tall as its
 * text needs. `busy` dims the cards while a re-run replaces them.
 */
export function WidgetGrid({
  children,
  busy = false,
}: Readonly<{ children?: ReactNode; busy?: boolean }>) {
  return (
    <div
      aria-busy={busy}
      className={cn(
        'grid grid-cols-[repeat(auto-fill,minmax(min(278px,100%),1fr))] gap-4 transition-opacity print:grid-cols-2',
        busy && 'opacity-50',
      )}
    >
      {children}
    </div>
  );
}
