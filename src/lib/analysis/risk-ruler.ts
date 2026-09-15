/** Flex weights for the two track segments either side of the ruler marker. */
export type RulerSegments = {
  /** Track before the marker (the covered part). */
  before: number;
  /** Track after the marker (the remaining scale). */
  after: number;
};

/**
 * Where the marker sits on the risk ruler, from a 0–100 position.
 *
 * The two segments are `flex-grow` weights, so the marker lands at `position` percent
 * of the track regardless of the card's width — the segment widths are never measured.
 */
export function rulerSegments(position: number): RulerSegments {
  // NaN would reach the DOM as `flex-grow: NaN`, an invalid value that collapses both
  // segments; an unknown position sits on the same edge an out-of-range one is clamped to.
  const clamped = Number.isNaN(position) ? 0 : Math.min(100, Math.max(0, position));

  return { before: clamped, after: 100 - clamped };
}
