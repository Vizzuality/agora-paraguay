import { useLayoutEffect, useRef, useState } from 'react';

import { type ScrollEdges, verticalScrollEdges } from '@/lib/scroll-edges';

const NO_OVERFLOW: ScrollEdges = { atStart: true, atEnd: true };

/**
 * Tracks which edges of a vertical scroller have content cut off behind them. Give the
 * returned `ref` to the scrolling element and render `<ScrollFades {...edges} />` over it
 * (inside a `relative` parent). Re-measures on scroll, on resize of the scroller or its
 * rows, and after every render, so a filtered list updates without further wiring.
 */
export function useScrollFade<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState(NO_OVERFLOW);

  useLayoutEffect(() => {
    const scroller = ref.current;
    if (!scroller) return;

    const update = () => {
      const next = verticalScrollEdges(scroller);
      // Same object back when nothing changed, or this effect would re-render forever.
      setEdges((prev) =>
        prev.atStart === next.atStart && prev.atEnd === next.atEnd ? prev : next,
      );
    };
    update();

    scroller.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    for (const row of scroller.children) observer.observe(row);

    return () => {
      scroller.removeEventListener('scroll', update);
      observer.disconnect();
    };
  });

  return { ref, edges };
}

const FADE_CLASS = 'pointer-events-none absolute inset-x-0 z-10 h-8 to-transparent';

/**
 * Gradients to the popover surface over the top and bottom of a scroller, each shown
 * only while rows are hidden behind that edge. Decorative: the rows stay reachable.
 */
export function ScrollFades({ atStart, atEnd }: Readonly<ScrollEdges>) {
  return (
    <>
      {!atStart && (
        <div
          aria-hidden
          data-slot="scroll-fade-top"
          className={`${FADE_CLASS} top-0 bg-linear-to-b from-popover`}
        />
      )}
      {!atEnd && (
        <div
          aria-hidden
          data-slot="scroll-fade-bottom"
          className={`${FADE_CLASS} bottom-0 bg-linear-to-t from-popover`}
        />
      )}
    </>
  );
}
