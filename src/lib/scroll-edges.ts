/** Whether a scroller sits at its start, its end, both (nothing overflows) or neither. */
export type ScrollEdges = { atStart: boolean; atEnd: boolean };

/**
 * Edge state from the three numbers any scroller exposes along one axis: how far it has
 * scrolled, how much is visible and how much there is. Sub-pixel scroll positions never
 * land exactly on the end: allow 1px of slack.
 */
export function scrollEdges(offset: number, visible: number, total: number): ScrollEdges {
  return { atStart: offset <= 0, atEnd: offset + visible >= total - 1 };
}

/** The vertical edges of a DOM scroller. */
export function verticalScrollEdges({
  scrollTop,
  clientHeight,
  scrollHeight,
}: Pick<HTMLElement, 'scrollTop' | 'clientHeight' | 'scrollHeight'>): ScrollEdges {
  return scrollEdges(scrollTop, clientHeight, scrollHeight);
}
