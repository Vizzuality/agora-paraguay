import { Group } from '@visx/group';
import { ParentSize } from '@visx/responsive';
import { scaleLinear } from '@visx/scale';
import { useId } from 'react';

import {
  Baseline,
  CAP_HEIGHT,
  CappedBar,
  HISTOGRAM_HEIGHT,
  TICK_ROW,
  tickAnchor,
  ToneGradients,
} from '@/components/charts/plot';
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
 * primitives over a plain SVG, as `ValueHistogram`; the bar, gradients and baseline come
 * from `plot.tsx`.
 */

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
      <ParentSize debounceTime={50} style={{ height: HISTOGRAM_HEIGHT + GAP + TICK_ROW }}>
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
  const unit = (HISTOGRAM_HEIGHT - caps) / Math.max(1, mostAbove + mostBelow);
  const baseline = mostAbove > 0 ? mostAbove * unit + CAP_HEIGHT : 0;

  const xScale = scaleLinear<number>({ domain: [min, max], range: [0, width] });
  const height = HISTOGRAM_HEIGHT + GAP + TICK_ROW;

  return (
    <svg width={width} height={height} className="block overflow-visible">
      <ToneGradients id={gradientId} />

      {bins.map((bin) => {
        const x = xScale(bin.from);
        const binWidth = xScale(bin.to) - x;

        return (
          <Group key={bin.from} left={x}>
            {bin.above > 0 && (
              <CappedBar
                y={baseline - (bin.above * unit + CAP_HEIGHT)}
                width={binWidth}
                height={bin.above * unit + CAP_HEIGHT}
                tone="low"
                gradientId={gradientId}
              />
            )}
            {bin.below > 0 && (
              <CappedBar
                y={baseline}
                width={binWidth}
                height={bin.below * unit + CAP_HEIGHT}
                tone="high"
                capAt="bottom"
                gradientId={gradientId}
              />
            )}
          </Group>
        );
      })}

      <Baseline y={baseline} width={width} />

      {/* The axis' ticks, the ones on the edges hugging them so nothing spills out of the card. */}
      {ticks.map((tick) => (
        <text
          key={tick}
          x={xScale(tick)}
          y={height}
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
                height={HISTOGRAM_HEIGHT}
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

/** "1 por encima, 2 por debajo" — only the sides with something in them, "ninguna" when empty. */
export function deviationCounts({ above, below }: { above: number; below: number }): string {
  const parts = [
    above > 0 ? `${above} por encima` : null,
    below > 0 ? `${below} por debajo` : null,
  ].filter((part) => part !== null);

  return parts.length > 0 ? parts.join(', ') : 'ninguna';
}
