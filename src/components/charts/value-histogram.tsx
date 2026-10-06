import { Group } from '@visx/group';
import { ParentSize } from '@visx/responsive';
import { scaleLinear } from '@visx/scale';
import { Bar } from '@visx/shape';
import { useId } from 'react';

import { TONE_COLOR, TONES } from '@/components/charts/tones';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatNumber } from '@/lib/analysis/number-scale';
import { binLabel, type ValueHistogramWidget } from '@/lib/analysis/value-histogram';

/*
 * The "Categorical and numerical multiple" and "Numerical multiple" designs: the scale as
 * a row of touching bins, each a bar as tall as its parcel count with a solid cap and a
 * body fading into the card, a baseline, the scale's ticks under it and — when the
 * indicator has classes — their names under those in equal thirds. visx primitives over a
 * plain SVG, as `CategoryBars`. Hovering a bin names its edges with its count in the
 * app's tooltip.
 */

/** The plot's height from the design; the bins stand on the baseline. */
const PLOT_HEIGHT = 145;
const CAP_HEIGHT = 4;
const RADIUS = 2;
/** The tick row under the baseline: one text line of 12px type. */
const TICK_ROW = 18;

type ValueHistogramProps = Pick<ValueHistogramWidget, 'min' | 'max' | 'ticks' | 'bins' | 'classes'>;

/**
 * The binned bars with the scale and class names. Presentational: the card lists the
 * counts for assistive tech itself, so the drawing is hidden from it.
 */
export function ValueHistogram({ min, max, ticks, bins, classes }: Readonly<ValueHistogramProps>) {
  return (
    <div aria-hidden className="flex flex-col">
      <ParentSize debounceTime={50} style={{ height: PLOT_HEIGHT + 1 + TICK_ROW }}>
        {({ width }) =>
          width > 0 ? (
            <HistogramSvg width={width} min={min} max={max} ticks={ticks} bins={bins} />
          ) : null
        }
      </ParentSize>
      {classes && (
        <ul className="flex text-center text-[12px] leading-[17.4px] text-muted-foreground opacity-70">
          {classes.map((riskClass) => (
            <li key={riskClass.label} className="min-w-0 flex-1">
              {riskClass.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function HistogramSvg({
  width,
  min,
  max,
  ticks,
  bins,
}: Readonly<Omit<ValueHistogramProps, 'classes'> & { width: number }>) {
  const gradientId = useId();
  const most = Math.max(0, ...bins.map((bin) => bin.count));

  const xScale = scaleLinear<number>({ domain: [min, max], range: [0, width] });
  const yScale = scaleLinear<number>({
    domain: [0, Math.max(1, most)],
    range: [0, PLOT_HEIGHT - CAP_HEIGHT],
  });

  return (
    <svg width={width} height={PLOT_HEIGHT + 1 + TICK_ROW} className="block overflow-visible">
      <defs>
        {TONES.map((tone) => (
          <linearGradient key={tone} id={`${gradientId}-${tone}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: TONE_COLOR[tone] }} />
            <stop offset="1" style={{ stopColor: 'var(--card)' }} />
          </linearGradient>
        ))}
      </defs>

      {bins.map((bin) => {
        if (bin.count === 0) return null;

        const x = xScale(bin.from);
        const binWidth = xScale(bin.to) - x;
        // The cap keeps its height on top of the body, so one parcel still shows as a cap.
        const barHeight = yScale(bin.count) + CAP_HEIGHT;
        const top = PLOT_HEIGHT - barHeight;

        return (
          <Group key={bin.from} left={x}>
            <Bar
              y={top}
              width={binWidth}
              height={barHeight}
              rx={RADIUS}
              fill={`url('#${gradientId}-${bin.tone}')`}
              opacity={0.2}
            />
            <Bar
              y={top}
              width={binWidth}
              height={CAP_HEIGHT}
              rx={RADIUS}
              style={{ fill: TONE_COLOR[bin.tone] }}
            />
          </Group>
        );
      })}

      <line
        x1={0}
        x2={width}
        y1={PLOT_HEIGHT + 0.5}
        y2={PLOT_HEIGHT + 0.5}
        className="stroke-foreground"
        strokeWidth={1}
      />

      {/* The scale's ticks, the ones on the edges hugging them so nothing spills out of the card. */}
      {ticks.map((tick) => (
        <text
          key={tick}
          x={xScale(tick)}
          y={PLOT_HEIGHT + 1 + TICK_ROW}
          textAnchor={tickAnchor(tick, min, max)}
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
              {binLabel(bin)}: {parcelCount(bin.count)}
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </svg>
  );
}

/**
 * A tick on an edge hugs it so no label spills out of the card; the rest centre on their
 * tick — a stepped scale's ticks sit half a bin in from the edges, so they centre too.
 */
function tickAnchor(tick: number, min: number, max: number): 'start' | 'middle' | 'end' {
  if (tick <= min) return 'start';
  if (tick >= max) return 'end';

  return 'middle';
}

function parcelCount(count: number): string {
  return count === 1 ? '1 parcela' : `${count} parcelas`;
}
