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
  return clampScrollLeft(target, { clientWidth, scrollWidth });
}

/**
 * Where the strip should scroll so the tab at `tabLeft` (its `offsetLeft` inside the
 * scroller) becomes the first visible one, sitting right after the strip's own leading
 * gutter (`padding`). Near the end the strip cannot scroll that far, so the tab lands as
 * far left as the content allows.
 */
export function scrollLeftForTab(
  tabLeft: number,
  { clientWidth, scrollWidth }: Omit<ScrollMetrics, 'scrollLeft'>,
  padding = 0,
): number {
  return clampScrollLeft(tabLeft - padding, { clientWidth, scrollWidth });
}

function clampScrollLeft(
  target: number,
  { clientWidth, scrollWidth }: Omit<ScrollMetrics, 'scrollLeft'>,
): number {
  return Math.min(Math.max(target, 0), Math.max(scrollWidth - clientWidth, 0));
}
