import { ValueHistogram } from '@/components/charts/value-histogram';
import { InfoTip } from '@/components/info-tip';
import { Card } from '@/components/ui/card';
import { binLabel, type ValueHistogramWidget } from '@/lib/analysis/value-histogram';
import { cn } from '@/lib/utils';

type ValueHistogramCardProps = Omit<ValueHistogramWidget, 'id'> & { className?: string };

/**
 * Widget binning the analysed parcels' values over a scale: a long range in its classes
 * (the "Categorical and numerical multiple" design) or an open number with its unit (the
 * "Numerical multiple" design) — the indicator's name, then the histogram with the scale
 * and, for a range, the class names under it. The occupied bins are listed for assistive
 * tech; the chart is decoration over that list.
 */
export function ValueHistogramCard({
  label,
  description,
  unit,
  min,
  max,
  ticks,
  classes,
  bins,
  className,
}: Readonly<ValueHistogramCardProps>) {
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
          .filter((bin) => bin.count > 0)
          .map((bin) => (
            <li key={bin.from}>
              {binLabel(bin)}: {bin.count}
            </li>
          ))}
      </ul>
      <ValueHistogram min={min} max={max} ticks={ticks} bins={bins} classes={classes} />
    </Card>
  );
}
