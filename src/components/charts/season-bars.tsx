import { Group } from '@visx/group';
import { scaleLinear } from '@visx/scale';
import { useId } from 'react';

import {
  Baseline,
  CAP_HEIGHT,
  CappedBar,
  HISTOGRAM_HEIGHT,
  HitAreas,
  parcelCount,
  Responsive,
  SVG_CLASS,
  TICK_ROW,
  ToneGradients,
} from '@/components/charts/plot';
import type { SeasonBarsWidget } from '@/lib/analysis/season-bars';

/*
 * The seasons over the years: a tick per year under the baseline, one bar per season
 * between its two years, as tall as its parcels, in the open-number histogram's tone.
 * A 1px gap on each side keeps neighbouring seasons apart, so they count one by one.
 * Hovering a season names it with its count ("2017-2018: 10 parcelas").
 */

/** Room a year label needs; past that density every other year is printed. */
const MIN_TICK_SPACING = 36;
const BAR_GAP = 1;

type SeasonBarsProps = Pick<SeasonBarsWidget, 'from' | 'to' | 'bars'>;

/** The edge years hug their edge so no label spills out of the card; the rest centre on their tick. */
function yearAnchor(year: number, from: number, to: number): 'start' | 'middle' | 'end' {
  if (year === from) return 'start';
  if (year === to) return 'end';

  return 'middle';
}

export function SeasonBars(props: Readonly<SeasonBarsProps>) {
  return <Responsive>{(width) => <SeasonBarsSvg width={width} {...props} />}</Responsive>;
}

function SeasonBarsSvg({ width, from, to, bars }: Readonly<SeasonBarsProps & { width: number }>) {
  const gradientId = useId();
  const most = Math.max(0, ...bars.map((bar) => bar.count));

  const xScale = scaleLinear<number>({ domain: [from, to], range: [0, width] });
  const yScale = scaleLinear<number>({
    domain: [0, Math.max(1, most)],
    range: [0, HISTOGRAM_HEIGHT - CAP_HEIGHT],
  });

  const years = Array.from({ length: to - from + 1 }, (_, index) => from + index);
  const step = Math.max(1, Math.ceil((years.length * MIN_TICK_SPACING) / Math.max(1, width)));

  return (
    <svg
      data-slot="chart"
      aria-hidden
      viewBox={`0 0 ${width} ${HISTOGRAM_HEIGHT + 1 + TICK_ROW}`}
      className={SVG_CLASS}
    >
      <ToneGradients id={gradientId} />

      {bars.map((bar) => {
        if (bar.count === 0) return null;

        const barHeight = yScale(bar.count) + CAP_HEIGHT;

        return (
          <Group key={bar.season} left={xScale(bar.start) + BAR_GAP}>
            <CappedBar
              y={HISTOGRAM_HEIGHT - barHeight}
              width={Math.max(1, xScale(bar.end) - xScale(bar.start) - 2 * BAR_GAP)}
              height={barHeight}
              tone="elevated"
              gradientId={gradientId}
            />
          </Group>
        );
      })}

      <Baseline y={HISTOGRAM_HEIGHT} width={width} />
      {years.map((year, index) => {
        // The last year always prints, so the axis ends on its span.
        if (index % step !== 0 && year !== to) return null;

        return (
          <text
            key={year}
            x={xScale(year)}
            y={HISTOGRAM_HEIGHT + 1 + TICK_ROW}
            textAnchor={yearAnchor(year, from, to)}
            dominantBaseline="text-after-edge"
            className="fill-muted-foreground text-[12px] tabular-nums"
          >
            {year}
          </text>
        );
      })}
      <HitAreas
        height={HISTOGRAM_HEIGHT}
        areas={bars.map((bar) => ({
          key: bar.season,
          x: xScale(bar.start),
          width: xScale(bar.end) - xScale(bar.start),
          label: `${bar.season}: ${parcelCount(bar.count)}`,
        }))}
      />
    </svg>
  );
}
