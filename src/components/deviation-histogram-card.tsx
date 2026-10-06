import { deviationCounts, DivergingHistogram } from '@/components/charts/diverging-histogram';
import { InfoTip } from '@/components/info-tip';
import { Card } from '@/components/ui/card';
import type { DeviationHistogramWidget } from '@/lib/analysis/deviation-widget';
import { binLabel } from '@/lib/analysis/value-histogram';
import { cn } from '@/lib/utils';

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
    <Card
      className={cn(
        'min-h-[254px] justify-between gap-6 rounded-3xl border-0 bg-card p-6 text-card-foreground shadow-none backdrop-blur-xs',
        className,
      )}
    >
      <div className="grid grid-cols-[auto_1fr] items-start gap-x-2 gap-y-1">
        <h3 className="text-[16px] leading-[20.3px] tracking-[0.28px] text-balance">{label}</h3>
        <InfoTip
          description={description}
          subject={label}
          className="mt-0.5 text-accent-foreground"
        />
        <p className="col-span-2 text-[12px] leading-[17.4px] text-muted-foreground opacity-70">
          {unit ?? 'Número de parcelas'}
        </p>
      </div>

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
    </Card>
  );
}
