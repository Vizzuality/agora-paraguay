export type ScrollDirection = 'left' | 'right';

/** The three numbers a horizontal scroller exposes; passed in so the math stays DOM-free. */
export type ScrollMetrics = {
  scrollLeft: number;
  clientWidth: number;
  scrollWidth: number;
};

/** Sub-pixel scroll positions never land exactly on the end: allow 1px of slack. */
export function scrollEdges({ scrollLeft, clientWidth, scrollWidth }: ScrollMetrics) {
  return {
    atStart: scrollLeft <= 0,
    atEnd: scrollLeft + clientWidth >= scrollWidth - 1,
  };
}

/**
 * Where the tab strip should scroll to when an arrow is pressed. Moves 80% of the
 * visible width so the tab at the old boundary stays in view as a landmark.
 */
export function nextScrollLeft(
  { scrollLeft, clientWidth, scrollWidth }: ScrollMetrics,
  direction: ScrollDirection,
): number {
  const step = clientWidth * 0.8;
  const target = direction === 'left' ? scrollLeft - step : scrollLeft + step;
  return Math.min(Math.max(target, 0), Math.max(scrollWidth - clientWidth, 0));
}
