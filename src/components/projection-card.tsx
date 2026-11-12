import { ProjectionBand } from '@/components/charts/projection-band';
import { WidgetCard, WidgetHeader } from '@/components/widget-card';
import { formatNumber } from '@/lib/analysis/number-scale';
import type { ProjectionWidget } from '@/lib/analysis/projection';

type ProjectionCardProps = Omit<ProjectionWidget, 'id'> & { className?: string };

/** The legend's words: the selection's band is percentiles of its parcels, a parcel's its own scenarios. */
const LEGEND = {
  multiple: {
    band: 'Rango pesimista-optimista de las parcelas (percentiles 10-90)',
    line: 'Central de las parcelas (promedio)',
  },
  individual: {
    band: 'Rango pesimista-optimista de la parcela',
    line: 'Central de la parcela',
  },
};

/**
 * Projected production as one chart across the card's row: the historical base and each
 * horizon, the pessimist–optimist band and the central line. The figures are listed for
 * assistive tech; the chart is decoration over that list.
 */
export function ProjectionCard({
  label,
  description,
  unit,
  scope,
  points,
  min,
  max,
  ticks,
  className,
}: Readonly<ProjectionCardProps>) {
  const legend = LEGEND[scope];
  const suffix = unit ? ` ${unit}` : '';

  return (
    <WidgetCard className={className}>
      <WidgetHeader label={label} description={description} />

      <ul className="sr-only">
        {points.map((point) => (
          <li key={point.label}>
            {point.label}: central {formatNumber(point.mid)}
            {suffix}, pesimista {formatNumber(point.low)}
            {suffix}, optimista {formatNumber(point.high)}
            {suffix}
          </li>
        ))}
      </ul>
      <ProjectionBand points={points} min={min} max={max} ticks={ticks} unit={unit} />

      <ul
        aria-hidden
        className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[12px] leading-[17.4px] text-muted-foreground"
      >
        <li className="flex items-center gap-2">
          <span className="size-4 rounded-[2px] bg-chart-1 opacity-50" />
          {legend.band}
        </li>
        <li className="flex items-center gap-2">
          <span className="h-1 w-4 rounded-[2px] bg-chart-1" />
          {legend.line}
        </li>
      </ul>
    </WidgetCard>
  );
}
