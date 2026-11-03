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
  const factor = niceFactor(raw / 10 ** power);

  return factor * 10 ** power;
}

/** d3's rounding of a raw step's mantissa to 1, 2, 5 or 10, at the geometric midpoints. */
function niceFactor(error: number): number {
  if (error >= Math.sqrt(50)) return 10;
  if (error >= Math.sqrt(10)) return 5;
  if (error >= Math.sqrt(2)) return 2;

  return 1;
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

/** Characters a widget's tick row holds at its narrowest (278px of 12px figures, with gaps). */
const TICK_ROW_CHARS = 40;

/**
 * The tick labels a narrow row can print: all of them when they fit, else every k-th, the
 * rest blanked so the kept ones stay on their ticks. `k` divides the gaps evenly, so both
 * ends always print.
 */
export function thinTickLabels(labels: string[], budget = TICK_ROW_CHARS): string[] {
  const gaps = labels.length - 1;
  const width = (shown: string[]) => shown.reduce((sum, label) => sum + label.length + 1, 0);

  if (gaps <= 1 || width(labels) <= budget) return labels;

  for (let every = 2; every < gaps; every += 1) {
    if (gaps % every !== 0) continue;

    const kept = labels.filter((_, index) => index % every === 0);

    if (width(kept) <= budget)
      return labels.map((label, index) => (index % every === 0 ? label : ''));
  }

  return labels.map((label, index) => (index === 0 || index === gaps ? label : ''));
}

/** From here a tick reads compact ("500 mil", "1,5 M"): full digits run into each other. */
const COMPACT_TICK_FROM = 10_000;

/** A scale's tick as printed: like `formatNumber`, compact once the figures get long. */
export function formatTick(value: number): string {
  if (Math.abs(value) < COMPACT_TICK_FROM) return formatNumber(value);

  // Spelled out rather than `notation: 'compact'`, whose Spanish words vary by ICU build.
  const tenths = (scaled: number) => formatNumber(Math.round(scaled * 10) / 10);

  return Math.abs(value) >= 1_000_000
    ? `${tenths(value / 1_000_000)} M`
    : `${tenths(value / 1000)} mil`;
}

/** A percentage's scale: the whole 0–100, so 60 % reads as 60 % whatever the set holds. */
const PERCENT_SCALE: NumberScale = { min: 0, max: 100, ticks: linearTicks(0, 100) };

/** An open number's scale by its unit: a percentage always spans 0–100, the rest the set's values. */
export function openNumberScale(values: number[], unit: string | null | undefined): NumberScale {
  return unit === '%' ? PERCENT_SCALE : numberScale(values);
}

/** A figure as printed: platform locale, two decimals at most. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-PY', { maximumFractionDigits: 2 }).format(value);
}
