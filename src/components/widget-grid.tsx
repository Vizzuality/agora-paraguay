import type { ReactNode } from 'react';

/**
 * The indicator cards, as many as are selected — no empty frames. Auto-fill columns keep
 * every card the same width whether it has company or not: at least 389px (the Figma
 * tile), never wider than the container, and as tall as its text needs.
 */
export function WidgetGrid({ children }: Readonly<{ children?: ReactNode }>) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(389px,100%),1fr))] gap-4">
      {children}
    </div>
  );
}
