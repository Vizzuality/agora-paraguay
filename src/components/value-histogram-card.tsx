import { ValueHistogram } from '@/components/charts/value-histogram';
import { WidgetCard, WidgetHeader } from '@/components/widget-card';
import { binLabel, type ValueHistogramWidget } from '@/lib/analysis/value-histogram';

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
    <WidgetCard className={className}>
      <WidgetHeader
        label={label}
        description={description}
        subtitle={unit ?? 'Número de parcelas'}
      />

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
    </WidgetCard>
  );
}
