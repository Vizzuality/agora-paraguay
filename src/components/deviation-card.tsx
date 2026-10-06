import {
  TrackMarker,
  TrackTicks,
  WidgetCard,
  WidgetFigure,
  WidgetHeader,
} from '@/components/widget-card';
import { formatSigned, type DeviationWidget } from '@/lib/analysis/deviation-widget';
import { formatNumber } from '@/lib/analysis/number-scale';

type DeviationCardProps = Omit<DeviationWidget, 'id'> & { className?: string };

/**
 * Widget for one parcel's signed deviation from a reference (the diverging Widget03
 * design): the indicator's name and unit, the figure large with its sign, and a track
 * with the reference in the middle — red to the left, blue to the right — the marker on
 * the side the sign puts it, in that side's colour. Under the track, the reference's own
 * value (the parcel's base production) with the track's ends either side of it in the
 * same unit; without a base, the deviation scale itself.
 */
export function DeviationCard({
  label,
  description,
  unit,
  text,
  span,
  position,
  base,
  className,
}: Readonly<DeviationCardProps>) {
  const negative = position < 50;
  // The marker's place within its own half, 0–100 from the middle outwards.
  const within = Math.abs(position - 50) * 2;
  // The base as read out: its figure with the unit when there is one.
  const baseText = base === null ? null : [formatNumber(base), unit].filter(Boolean).join(' ');

  return (
    <WidgetCard className={className}>
      <WidgetHeader label={label} description={description} subtitle={unit} />

      <div className="flex flex-col gap-1">
        <WidgetFigure>
          {text}
          {unit && <span className="sr-only"> {unit}</span>}
        </WidgetFigure>
        {/* Presentational: the figure above already says the value (see `RiskRuler`). */}
        <div aria-hidden className="flex flex-col gap-1">
          <div className="flex w-full items-center gap-[2px] p-px">
            {negative ? (
              <>
                <Half tone="bg-risk-high" at={100 - within} />
                <span className="h-2 min-w-0 flex-1 rounded-[2px] bg-risk-low opacity-50" />
              </>
            ) : (
              <>
                <span className="h-2 min-w-0 flex-1 rounded-[2px] bg-risk-high opacity-50" />
                <Half tone="bg-risk-low" at={within} />
              </>
            )}
          </div>
          <TrackTicks labels={scaleLabels(span, base)} slot={{ index: 1, name: 'base' }} />
        </div>
        {baseText && <p className="sr-only">Base: {baseText}</p>}
      </div>
    </WidgetCard>
  );
}

/** The three labels under the track: the base with the ends either side, else the deviation scale. */
function scaleLabels(span: number, base: number | null): string[] {
  if (base === null) return [formatSigned(-span), '0', formatSigned(span)];

  return [formatNumber(base - span), formatNumber(base), formatNumber(base + span)];
}

/** One half of the track, in its side's colour, with the marker at `at` (0–100 from its left edge). */
function Half({ tone, at }: Readonly<{ tone: string; at: number }>) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-[2px]">
      <TrackMarker at={at} track={`${tone} opacity-50`} marker={tone} />
    </span>
  );
}
