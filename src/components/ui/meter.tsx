import { cn } from '@/lib/utils';

const SEGMENTS = 28;

type MeterProps = {
  /** 0–100. Values outside the range are clamped. */
  value: number;
  /** Fill colour. Defaults to the first categorical hue. */
  color?: string;
  className?: string;
};

/**
 * Segmented meter.
 *
 * Discrete ticks rather than a continuous bar: at these sizes a solid bar invites
 * reading a precise value off its length, which it cannot support. Ticks quantise the
 * claim to something the mark can actually carry.
 *
 * The unfilled track is a light tint of the fill hue, not grey, so the state reads
 * across the whole bar. The final filled tick is the full hue, marking the value the
 * way a cap does.
 *
 * Presentational on purpose: callers render the value as text beside it (see
 * `StatCard`), so exposing the meter to assistive technology would announce the same
 * number twice. That printed value is also what keeps the green/blue pair legible for
 * tritan viewers, who cannot rely on the hue.
 */
export function Meter({ value, color = 'var(--chart-1)', className }: MeterProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const filled = Math.round((clamped / 100) * SEGMENTS);

  return (
    <div aria-hidden className={cn('flex items-end gap-[2px]', className)}>
      {Array.from({ length: SEGMENTS }, (_, index) => {
        const isFilled = index < filled;
        const isCap = index === filled - 1;

        return (
          <span
            key={index}
            className={cn('h-3.5 w-[3px] rounded-[1px]', isCap && 'h-4')}
            style={{
              backgroundColor: isFilled
                ? isCap
                  ? color
                  : `color-mix(in oklab, ${color} 55%, white)`
                : `color-mix(in oklab, ${color} 12%, white)`,
            }}
          />
        );
      })}
    </div>
  );
}
