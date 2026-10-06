import { deviationCounts, DivergingHistogram } from '@/components/charts/diverging-histogram';
import { WidgetCard, WidgetHeader } from '@/components/widget-card';
import type { DeviationHistogramWidget } from '@/lib/analysis/deviation-widget';
import { binLabel } from '@/lib/analysis/value-histogram';

type DeviationHistogramCardProps = Omit<DeviationHistogramWidget, 'id'> & { className?: string };

/**
 * Widget for the analysed parcels' deviations from their base (the diverging Widget03
 * design for several parcels): the indicator's name and unit, then the histogram with a
 * bar up per bin for the parcels above their base and one down for those below, the
 * axis under it. The occupied bins are listed for assistive tech; the chart is
 * decoration over that list.
 */
export function DeviationHistogramCard({
  label,
  description,
  unit,
  min,
  max,
  ticks,
  bins,
  className,
}: Readonly<DeviationHistogramCardProps>) {
  return (
    <WidgetCard className={className}>
      <WidgetHeader
        label={label}
        description={description}
        subtitle={unit ?? 'Número de parcelas'}
      />

      <ul className="sr-only">
        {bins
          .filter((bin) => bin.above > 0 || bin.below > 0)
          .map((bin) => (
            <li key={bin.from}>
              {binLabel(bin)}: {deviationCounts(bin)}
            </li>
          ))}
      </ul>
      <DivergingHistogram min={min} max={max} ticks={ticks} bins={bins} />
    </WidgetCard>
  );
}
