import { classIndexAt, type RiskClass } from './widget-config';

/** One band of the risk ruler: a class, and the marker when the reading falls in it. */
export type RulerBand = RiskClass & {
  /** This class or one below it holds the reading: its label prints strong. */
  reached: boolean;
  /**
   * Flex weights for the track either side of the marker, only on the band the reading
   * falls in. `before` is where the marker lands within the band, as a percentage.
   */
  marker?: { before: number; after: number };
};

/**
 * The ruler for a reading: one band per class, all the same width, the marker inside the
 * band the position falls in, at where it falls within it. Weights rather than widths,
 * so the marker lands at the same place whatever the widget's width — nothing is measured.
 */
export function rulerBands(position: number, classes: readonly RiskClass[]): RulerBand[] {
  // NaN would reach the DOM as `flex-grow: NaN`, an invalid value that collapses the
  // track; an unknown position sits on the same edge an out-of-range one is clamped to.
  const clamped = Number.isNaN(position) ? 0 : Math.min(100, Math.max(0, position));
  const active = classIndexAt(clamped, classes.length);
  // Scaled by the class count before subtracting, so the band edges come out exact.
  const within = Math.min(100, Math.max(0, clamped * classes.length - active * 100));

  return classes.map((riskClass, index) => ({
    ...riskClass,
    reached: index <= active,
    ...(index === active ? { marker: { before: within, after: 100 - within } } : {}),
  }));
}
