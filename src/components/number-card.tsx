import {
  TrackMarker,
  TrackTicks,
  WidgetCard,
  WidgetFigure,
  WidgetHeader,
} from '@/components/widget-card';
import { formatNumber } from '@/lib/analysis/number-scale';
import type { NumberWidget } from '@/lib/analysis/number-widget';

type NumberCardProps = Omit<NumberWidget, 'id'> & { className?: string };

/**
 * Widget for one parcel's open number (the "Numerical individual" design): the
 * indicator's name and unit, the figure large, and a track with the marker at the value's
 * place on the scale, the scale's ticks under it.
 */
export function NumberCard({
  label,
  description,
  unit,
  text,
  ticks,
  position,
  className,
}: Readonly<NumberCardProps>) {
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
            <TrackMarker
              at={position}
              track="bg-risk-medium opacity-50"
              after="bg-risk-neutral opacity-20"
              marker="bg-risk-medium"
            />
          </div>
          <TrackTicks labels={ticks.map(formatNumber)} />
        </div>
      </div>
    </WidgetCard>
  );
}
