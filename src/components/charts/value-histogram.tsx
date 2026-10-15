import { Group } from '@visx/group';
import { scaleLinear } from '@visx/scale';
import { useId } from 'react';

import {
  AxisTicks,
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
import { binLabel, type ValueHistogramWidget } from '@/lib/analysis/value-histogram';

/*
 * The "Categorical and numerical multiple" and "Numerical multiple" designs: the scale as
 * a row of touching bins, each a bar as tall as its parcel count with a solid cap and a
 * body fading into the card, a baseline, the scale's ticks under it and — when the
 * indicator has classes — their names under those in equal thirds. visx primitives over a
 * plain SVG, as `CategoryBars`; the bar, gradients, baseline, ticks and hit areas come
 * from `plot.tsx`. Hovering a bin names its edges with its count in the app's tooltip.
 */

type ValueHistogramProps = Pick<ValueHistogramWidget, 'min' | 'max' | 'ticks' | 'bins' | 'classes'>;

/** The binned bars with the scale and class names. */
export function ValueHistogram({ min, max, ticks, bins, classes }: Readonly<ValueHistogramProps>) {
  return (
    <div className="flex flex-col">
      <Responsive height={HISTOGRAM_HEIGHT + 1 + TICK_ROW}>
        {(width) => <HistogramSvg width={width} min={min} max={max} ticks={ticks} bins={bins} />}
      </Responsive>
      {classes && (
        <ul
          aria-hidden
          className="flex text-center text-[12px] leading-[17.4px] text-muted-foreground opacity-70"
        >
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
    range: [0, HISTOGRAM_HEIGHT - CAP_HEIGHT],
  });

  return (
    <svg
      data-slot="chart"
      viewBox={`0 0 ${width} ${HISTOGRAM_HEIGHT + 1 + TICK_ROW}`}
      className={SVG_CLASS}
    >
      <ToneGradients id={gradientId} />

      {bins.map((bin) => {
        if (bin.count === 0) return null;

        const x = xScale(bin.from);
        const binWidth = xScale(bin.to) - x;
        // The cap keeps its height on top of the body, so one parcel still shows as a cap.
        const barHeight = yScale(bin.count) + CAP_HEIGHT;
        const top = HISTOGRAM_HEIGHT - barHeight;

        return (
          <Group key={bin.from} left={x}>
            <CappedBar
              y={top}
              width={binWidth}
              height={barHeight}
              tone={bin.tone}
              gradientId={gradientId}
            />
          </Group>
        );
      })}

      <Baseline y={HISTOGRAM_HEIGHT} width={width} />
      <AxisTicks ticks={ticks} x={xScale} y={HISTOGRAM_HEIGHT + 1 + TICK_ROW} min={min} max={max} />
      <HitAreas
        height={HISTOGRAM_HEIGHT}
        areas={bins.map((bin) => ({
          key: bin.from,
          x: xScale(bin.from),
          width: xScale(bin.to) - xScale(bin.from),
          label: `${binLabel(bin)}: ${parcelCount(bin.count)}`,
        }))}
      />
    </svg>
  );
}
