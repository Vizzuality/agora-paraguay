import { Group } from '@visx/group';
import { ParentSize } from '@visx/responsive';
import { scaleBand, scaleLinear } from '@visx/scale';
import { Bar } from '@visx/shape';
import { useId } from 'react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { CategoryColumn, CategoryTone } from '@/lib/analysis/category-counts';

/*
 * The "Categorical multiple" design: a column per category, the count over a bar
 * whose cap is solid and whose body fades into the card, a baseline, the names under.
 * visx primitives over a plain SVG — the card is a handful of rectangles, so no chart
 * component: the scales place them, `ParentSize` gives the width. Hovering a column
 * names it with its count in the app's tooltip.
 */

/** The column's height from the design: the count line, a gap, then the bar. */
const PLOT_HEIGHT = 98;
const COUNT_LINE = 17.4;
const COUNT_GAP = 4;
const BAR_MAX = PLOT_HEIGHT - COUNT_LINE - COUNT_GAP;
const CAP_HEIGHT = 4;
const RADIUS = 2;
/** The space between columns, the same `gap-2` the label row under the chart uses. */
const COLUMN_GAP = 8;

/** The bar's hue per class; the same tokens the ruler paints with. */
const TONE_COLOR: Record<CategoryTone, string> = {
  low: 'var(--muted-foreground)',
  mid: 'var(--risk-low)',
  high: 'var(--risk-medium)',
};

const TONES: CategoryTone[] = ['low', 'mid', 'high'];

type CategoryBarsProps = {
  columns: CategoryColumn[];
};

/**
 * The count bars with their labels. Presentational: the card lists the counts for
 * assistive tech itself, so the drawing is hidden from it.
 */
export function CategoryBars({ columns }: CategoryBarsProps) {
  return (
    <div aria-hidden className="flex flex-col">
      <ParentSize debounceTime={50} style={{ height: PLOT_HEIGHT + 1 }}>
        {({ width }) => (width > 0 ? <BarsSvg width={width} columns={columns} /> : null)}
      </ParentSize>
      <ul className="flex gap-2 text-center text-[12px] leading-[17.4px] text-muted-foreground opacity-70">
        {columns.map((column) => (
          <li key={column.label} className="min-w-0 flex-1">
            {column.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BarsSvg({ width, columns }: CategoryBarsProps & { width: number }) {
  const gradientId = useId();
  const max = Math.max(0, ...columns.map((column) => column.count));

  // A fixed 8px gap, like the flex row of labels under the chart: with n bands over the
  // width, the step is (width + gap) / n, so the inner padding is gap / step.
  const xScale = scaleBand<string>({
    domain: columns.map((column) => column.label),
    range: [0, width],
    paddingInner: (COLUMN_GAP * columns.length) / (width + COLUMN_GAP),
    paddingOuter: 0,
  });
  const yScale = scaleLinear<number>({ domain: [0, Math.max(1, max)], range: [0, BAR_MAX] });
  const bandwidth = xScale.bandwidth();

  return (
    <svg width={width} height={PLOT_HEIGHT + 1} className="block overflow-visible">
      <defs>
        {TONES.map((tone) => (
          <linearGradient key={tone} id={`${gradientId}-${tone}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: TONE_COLOR[tone] }} />
            <stop offset="1" style={{ stopColor: 'var(--card)' }} />
          </linearGradient>
        ))}
      </defs>

      {columns.map((column) => {
        if (column.count === 0) return null;

        const x = xScale(column.label) ?? 0;
        const barHeight = yScale(column.count);
        const top = PLOT_HEIGHT - barHeight;

        return (
          <Group key={column.label} left={x}>
            <text
              x={bandwidth / 2}
              y={top - COUNT_GAP}
              textAnchor="middle"
              dominantBaseline="text-after-edge"
              className="fill-foreground text-[12px] font-semibold tabular-nums"
            >
              {column.count}
            </text>
            <Bar
              y={top}
              width={bandwidth}
              height={barHeight}
              rx={RADIUS}
              fill={`url('#${gradientId}-${column.tone}')`}
              opacity={0.2}
            />
            <Bar
              y={top}
              width={bandwidth}
              height={CAP_HEIGHT}
              rx={RADIUS}
              style={{ fill: TONE_COLOR[column.tone] }}
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

      {/* One hit area per column, the full plot height, so an empty column answers too. */}
      <TooltipProvider>
        {columns.map((column) => (
          <Tooltip key={column.label}>
            <TooltipTrigger asChild>
              <rect
                x={xScale(column.label) ?? 0}
                y={0}
                width={bandwidth}
                height={PLOT_HEIGHT}
                fill="transparent"
              />
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={4}>
              {column.label}: {parcelCount(column.count)}
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </svg>
  );
}

function parcelCount(count: number): string {
  return count === 1 ? '1 parcela' : `${count} parcelas`;
}
