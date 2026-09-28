import type { ReactNode } from 'react';

/**
 * The indicator cards, as many as are selected — no empty frames. Auto-fill columns keep a
 * card the same width whether it has company or not.
 */
export function WidgetGrid({ children }: Readonly<{ children?: ReactNode }>) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">{children}</div>
  );
}
