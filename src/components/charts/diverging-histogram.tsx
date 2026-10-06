import { Group } from '@visx/group';
import { ParentSize } from '@visx/responsive';
import { scaleLinear } from '@visx/scale';
import { Bar } from '@visx/shape';
import { useId } from 'react';

import { TONE_COLOR } from '@/components/charts/tones';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DeviationHistogramWidget } from '@/lib/analysis/deviation-widget';
import { formatNumber } from '@/lib/analysis/number-scale';
import { binLabel } from '@/lib/analysis/value-histogram';

/*
 * The diverging Widget03 design for several parcels: the axis as a row of touching bins,
 * each with a bar standing up from the baseline for the parcels above their base (blue)
 * and one hanging down for those below (red), both with a solid cap at the far end and a
 * body fading into the card towards the baseline. One parcel is the same height either
 * way, so the two sides share a scale; the baseline sits where the counts put it. visx
 * primitives over a plain SVG, as `ValueHistogram`.
 */

/** The plot's height from the design, both sides together. */
const PLOT_HEIGHT = 145;
const CAP_HEIGHT = 4;
const RADIUS = 2;
/** The tick row under the plot: one text line of 12px type. */
const TICK_ROW = 18;
/** Room between the lowest bar and the tick row. */
const GAP = 4;

type DivergingHistogramProps = Pick<DeviationHistogramWidget, 'min' | 'max' | 'ticks' | 'bins'>;

/**
 * The bars either side of the baseline with the axis. Presentational: the card lists the
 * counts for assistive tech itself, so the drawing is hidden from it.
 */
export function DivergingHistogram({ min, max, ticks, bins }: Readonly<DivergingHistogramProps>) {
  return (
    <div aria-hidden>
      <ParentSize debounceTime={50} style={{ height: PLOT_HEIGHT + GAP + TICK_ROW }}>
        {({ width }) =>
          width > 0 ? (
            <HistogramSvg width={width} min={min} max={max} ticks={ticks} bins={bins} />
          ) : null
        }
      </ParentSize>
    </div>
  );
}

function HistogramSvg({
  width,
  min,
  max,
  ticks,
  bins,
}: Readonly<DivergingHistogramProps & { width: number }>) {
  const gradientId = useId();
  const mostAbove = Math.max(0, ...bins.map((bin) => bin.above));
  const mostBelow = Math.max(0, ...bins.map((bin) => bin.below));
  // Each side gets a cap's room when it has anything to show; the rest is split by count.
  const caps = (mostAbove > 0 ? CAP_HEIGHT : 0) + (mostBelow > 0 ? CAP_HEIGHT : 0);
  const unit = (PLOT_HEIGHT - caps) / Math.max(1, mostAbove + mostBelow);
  const baseline = mostAbove > 0 ? mostAbove * unit + CAP_HEIGHT : 0;

  const xScale = scaleLinear<number>({ domain: [min, max], range: [0, width] });
  const height = PLOT_HEIGHT + GAP + TICK_ROW;

  return (
    <svg width={width} height={height} className="block overflow-visible">
      <defs>
        {/* Up bars fade downwards into the card, down bars fade upwards. */}
        <linearGradient id={`${gradientId}-above`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: TONE_COLOR.low }} />
          <stop offset="1" style={{ stopColor: 'var(--card)' }} />
        </linearGradient>
        <linearGradient id={`${gradientId}-below`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" style={{ stopColor: TONE_COLOR.high }} />
          <stop offset="1" style={{ stopColor: 'var(--card)' }} />
        </linearGradient>
      </defs>

      {bins.map((bin) => {
        const x = xScale(bin.from);
        const binWidth = xScale(bin.to) - x;

        return (
          <Group key={bin.from} left={x}>
            {bin.above > 0 && (
              <Side
                top={baseline - (bin.above * unit + CAP_HEIGHT)}
                height={bin.above * unit + CAP_HEIGHT}
                width={binWidth}
                capAt="top"
                fill={`url('#${gradientId}-above')`}
                color={TONE_COLOR.low}
              />
            )}
            {bin.below > 0 && (
              <Side
                top={baseline}
                height={bin.below * unit + CAP_HEIGHT}
                width={binWidth}
                capAt="bottom"
                fill={`url('#${gradientId}-below')`}
                color={TONE_COLOR.high}
              />
            )}
          </Group>
        );
      })}

      <line
        x1={0}
        x2={width}
        y1={baseline + 0.5}
        y2={baseline + 0.5}
        className="stroke-foreground"
        strokeWidth={1}
      />

      {/* The axis' ticks, the ends hugging the edges so nothing spills out of the card. */}
      {ticks.map((tick, index) => (
        <text
          key={tick}
          x={xScale(tick)}
          y={height}
          textAnchor={tickAnchor(index, ticks.length)}
          dominantBaseline="text-after-edge"
          className="fill-muted-foreground text-[12px] opacity-70"
        >
          {formatNumber(tick)}
        </text>
      ))}

      {/* One hit area per bin, the full plot height, so an empty bin answers too. */}
      <TooltipProvider>
        {bins.map((bin) => (
          <Tooltip key={bin.from}>
            <TooltipTrigger asChild>
              <rect
                x={xScale(bin.from)}
                y={0}
                width={xScale(bin.to) - xScale(bin.from)}
                height={PLOT_HEIGHT}
                fill="transparent"
              />
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={4}>
              {binLabel(bin)}: {deviationCounts(bin)}
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </svg>
  );
}

/** One bar of a bin: the fading body with a solid cap at its far end. */
function Side({
  top,
  height,
  width,
  capAt,
  fill,
  color,
}: Readonly<{
  top: number;
  height: number;
  width: number;
  capAt: 'top' | 'bottom';
  fill: string;
  color: string;
}>) {
  return (
    <>
      <Bar y={top} width={width} height={height} rx={RADIUS} fill={fill} opacity={0.2} />
      <Bar
        y={capAt === 'top' ? top : top + height - CAP_HEIGHT}
        width={width}
        height={CAP_HEIGHT}
        rx={RADIUS}
        style={{ fill: color }}
      />
    </>
  );
}

/** The ends hug the edges so no label spills out of the card; the rest centre on their tick. */
function tickAnchor(index: number, count: number): 'start' | 'middle' | 'end' {
  if (index === 0) return 'start';
  if (index === count - 1) return 'end';

  return 'middle';
}

/** "1 por encima, 2 por debajo" — only the sides with something in them, "ninguna" when empty. */
export function deviationCounts({ above, below }: { above: number; below: number }): string {
  const parts = [
    above > 0 ? `${above} por encima` : null,
    below > 0 ? `${below} por debajo` : null,
  ].filter((part) => part !== null);

  return parts.length > 0 ? parts.join(', ') : 'ninguna';
}
