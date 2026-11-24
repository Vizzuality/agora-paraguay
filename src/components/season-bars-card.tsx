import { parcelCount } from '@/components/charts/plot';
import { SeasonBars } from '@/components/charts/season-bars';
import { WidgetCard, WidgetHeader } from '@/components/widget-card';
import type { SeasonBarsWidget } from '@/lib/analysis/season-bars';

type SeasonBarsCardProps = Omit<SeasonBarsWidget, 'id'> & { className?: string };

/**
 * Widget for a list of seasons under Todas: the parcels that grew the crop in each season,
 * over the years. The seasons grown are listed for assistive tech and, on paper, where
 * there is no tooltip, under the chart.
 */
export function SeasonBarsCard({
  label,
  description,
  from,
  to,
  bars,
  className,
}: Readonly<SeasonBarsCardProps>) {
  const grown = bars.filter((bar) => bar.count > 0);

  return (
    <WidgetCard className={className}>
      <WidgetHeader label={label} description={description} subtitle="Número de parcelas" />

      <div className="flex flex-col gap-2">
        <SeasonBars from={from} to={to} bars={bars} />
        <ul className="sr-only print:not-sr-only print:flex print:flex-wrap print:gap-x-3 print:text-[12px] print:leading-[17.4px] print:text-muted-foreground">
          {grown.map((bar) => (
            <li key={bar.season}>
              {bar.season}: {parcelCount(bar.count)}
            </li>
          ))}
        </ul>
      </div>
    </WidgetCard>
  );
}
