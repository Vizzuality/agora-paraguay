import { Group } from '@visx/group';
import { ParentSize } from '@visx/responsive';
import { scaleBand, scaleLinear } from '@visx/scale';
import { useId } from 'react';

import {
  Baseline,
  CappedBar,
  COLUMNS_HEIGHT,
  parcelCount,
  ToneGradients,
} from '@/components/charts/plot';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { CategoryColumn } from '@/lib/analysis/category-counts';

/*
 * The "Categorical multiple" design: a column per class, the count over a bar
 * whose cap is solid and whose body fades into the card, a baseline, the names under.
 * visx primitives over a plain SVG — the card is a handful of rectangles, so no chart
 * component: the scales place them, `ParentSize` gives the width; the bar, gradients and
 * baseline come from `plot.tsx`. Hovering a column names it with its count in the app's
 * tooltip.
 */

/** Padding above the tallest bar for its count: one 12px text line, and the gap between the two. */
const COUNT_LABEL_HEIGHT = 17.4;
const COUNT_LABEL_GAP = 4;
const MAX_BAR_HEIGHT = COLUMNS_HEIGHT - COUNT_LABEL_HEIGHT - COUNT_LABEL_GAP;
/** The space between columns, the same `gap-2` the label row under the chart uses. */
const COLUMN_GAP = 8;

type CategoryBarsProps = {
  columns: CategoryColumn[];
};

/**
 * The count bars with their labels. Presentational: the card lists the counts for
 * assistive tech itself, so the drawing is hidden from it.
 */
export function CategoryBars({ columns }: Readonly<CategoryBarsProps>) {
  return (
    <div aria-hidden className="flex flex-col">
      <ParentSize debounceTime={50} style={{ height: COLUMNS_HEIGHT + 1 }}>
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

function BarsSvg({ width, columns }: Readonly<CategoryBarsProps & { width: number }>) {
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
  const yScale = scaleLinear<number>({ domain: [0, Math.max(1, max)], range: [0, MAX_BAR_HEIGHT] });
  const bandwidth = xScale.bandwidth();

  return (
    <svg width={width} height={COLUMNS_HEIGHT + 1} className="block overflow-visible">
      <ToneGradients id={gradientId} />

      {columns.map((column) => {
        if (column.count === 0) return null;

        const x = xScale(column.label) ?? 0;
        const barHeight = yScale(column.count);
        const top = COLUMNS_HEIGHT - barHeight;

        return (
          <Group key={column.label} left={x}>
            <text
              x={bandwidth / 2}
              y={top - COUNT_LABEL_GAP}
              textAnchor="middle"
              dominantBaseline="text-after-edge"
              className="fill-foreground text-[12px] font-semibold tabular-nums"
            >
              {column.count}
            </text>
            <CappedBar
              y={top}
              width={bandwidth}
              height={barHeight}
              tone={column.tone}
              gradientId={gradientId}
            />
          </Group>
        );
      })}

      <Baseline y={COLUMNS_HEIGHT} width={width} />

      {/* One hit area per column, the full plot height, so an empty column answers too. */}
      <TooltipProvider>
        {columns.map((column) => (
          <Tooltip key={column.label}>
            <TooltipTrigger asChild>
              <rect
                x={xScale(column.label) ?? 0}
                y={0}
                width={bandwidth}
                height={COLUMNS_HEIGHT}
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
