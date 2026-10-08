import type { ReactNode } from 'react';

import { TrackMarker, WidgetCard, WidgetFigure, WidgetHeader } from '@/components/widget-card';
import type { IndicatorCard, RiskScale } from '@/lib/analysis/indicator-cards';
import { rulerBands } from '@/lib/analysis/risk-ruler';
import type { RiskTone } from '@/lib/analysis/widget-config';
import { cn } from '@/lib/utils';

/** What `indicatorCards()` produces, minus the id the list keys on. */
type RiskClassCardProps = Omit<IndicatorCard, 'id'> & {
  /** Top-right slot. Hidden in the design for now, kept for parity with `StatCard`. */
  action?: ReactNode;
  className?: string;
};

/**
 * Widget for a classed indicator: a label, the class as the large
 * figure, and a ruler of one band per class with the marker inside the class the reading
 * falls in, the class names under the bands. Light surface (`WidgetCard`), unlike
 * `StatCard`'s navy `bg-widget` — the two are different widgets in the design.
 */
export function RiskClassCard({
  label,
  description,
  level,
  scale,
  action,
  className,
}: Readonly<RiskClassCardProps>) {
  return (
    <WidgetCard className={className}>
      <WidgetHeader label={label} description={description} action={action} />

      <div className="flex flex-col gap-1">
        <WidgetFigure slot="risk-level">
          {level}
          {scale?.value && <span className="sr-only"> ({scale.value})</span>}
        </WidgetFigure>
        {scale && <RiskRuler {...scale} />}
      </div>
    </WidgetCard>
  );
}

/** Track colour per band: the coloured classes in their hue at half strength, the grey one faint. */
const TRACK_CLASS: Record<RiskTone, string> = {
  low: 'bg-risk-low opacity-50',
  medium: 'bg-risk-neutral opacity-20',
  elevated: 'bg-risk-medium opacity-50',
  high: 'bg-risk-high opacity-50',
};

/** The marker takes its band's hue at full strength. */
const MARKER_CLASS: Record<RiskTone, string> = {
  low: 'bg-risk-low',
  medium: 'bg-risk-neutral',
  elevated: 'bg-risk-medium',
  high: 'bg-risk-high',
};

/**
 * Presentational: the class is printed right above it (with the exact value, when there
 * is one), so exposing the ruler and its labels would announce the same reading twice.
 * The other tracks and charts hide themselves for the same reason.
 */
function RiskRuler({ classes, position, value }: Readonly<RiskScale>) {
  const bands = rulerBands(position, classes);

  return (
    <div aria-hidden className="flex flex-col gap-1">
      {/* The value sits over the marker; the top padding makes its room. */}
      <div className={cn('flex w-full items-center gap-[2px] p-px', value && 'pt-5')}>
        {bands.map((band) =>
          band.marker ? (
            <div key={band.label} className="flex min-w-0 flex-1 items-center gap-[2px]">
              <TrackMarker
                at={band.marker.before}
                track={TRACK_CLASS[band.tone]}
                marker={MARKER_CLASS[band.tone]}
              >
                {value && (
                  <span className="absolute bottom-full left-1/2 w-8 -translate-x-1/2 text-center text-[12px] leading-[17.4px] whitespace-nowrap text-foreground opacity-70">
                    {value}
                  </span>
                )}
              </TrackMarker>
            </div>
          ) : (
            <span
              key={band.label}
              className={cn('h-2 min-w-0 flex-1 rounded-[2px]', TRACK_CLASS[band.tone])}
            />
          ),
        )}
      </div>
      <div className="flex w-full text-center text-[12px] leading-[17.4px] opacity-70">
        {bands.map((band) => (
          <span
            key={band.label}
            className={cn(
              'min-w-0 flex-1',
              band.reached ? 'font-bold text-foreground' : 'text-muted-foreground',
            )}
          >
            {band.label}
          </span>
        ))}
      </div>
    </div>
  );
}
