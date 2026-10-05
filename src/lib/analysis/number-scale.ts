/*
 * The scale an open number (t/ha, no metadata range) is drawn on: from zero to a round
 * figure just above the largest analysed value, with the ticks d3 would pick — so the
 * number card of one parcel and the histogram of them all read on the same axis.
 */

export type NumberScale = { min: number; max: number; ticks: number[] };

/** How many ticks the scale aims for; the design draws eleven (0–10). */
const TICK_TARGET = 10;

/**
 * The tick step for `count` ticks over the span, as d3's `tickIncrement`: a power of ten
 * times 1, 2 or 5.
 */
export function tickStep(span: number, count = TICK_TARGET): number {
  if (span <= 0) return 1;

  const raw = span / count;
  const power = Math.floor(Math.log10(raw));
  const error = raw / 10 ** power;
  const factor =
    error >= Math.sqrt(50) ? 10 : error >= Math.sqrt(10) ? 5 : error >= Math.sqrt(2) ? 2 : 1;

  return factor * 10 ** power;
}

/** Every multiple of the step from `min` to `max`, both ends included when they are multiples. */
export function linearTicks(min: number, max: number, count = TICK_TARGET): number[] {
  const step = tickStep(max - min, count);
  const first = Math.ceil(min / step);
  const last = Math.floor(max / step);
  const ticks: number[] = [];

  for (let index = first; index <= last; index += 1) {
    // Multiply rather than accumulate, so 0.1 steps do not drift into 0.30000000000000004.
    ticks.push(Number((index * step).toPrecision(12)));
  }

  return ticks;
}

/**
 * The scale for the values: zero to the first tick at or above the largest one, so the
 * axis ends on a round figure (3.81 t/ha reads on 0–4). Nothing above zero gives 0–1.
 */
export function numberScale(values: number[]): NumberScale {
  const largest = Math.max(0, ...values);
  const step = tickStep(largest);
  const max = largest > 0 ? Number((Math.ceil(largest / step) * step).toPrecision(12)) : 1;

  return { min: 0, max, ticks: linearTicks(0, max) };
}

/** A figure as printed: platform locale, two decimals at most. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-PY', { maximumFractionDigits: 2 }).format(value);
}
