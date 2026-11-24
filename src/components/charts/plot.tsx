import { useParentSize } from '@visx/responsive';
import { Bar } from '@visx/shape';
import type { ReactNode } from 'react';

import { TONE_COLOR, TONES } from '@/components/charts/tones';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatTick } from '@/lib/analysis/number-scale';
import type { RiskTone } from '@/lib/analysis/widget-config';

/*
 * What the analysis charts share, from the designs: the geometry of a bar (a solid cap
 * over a body that fades into the card), the plot and tick-row heights of the histograms,
 * the baseline, the axis ticks, the tooltip hit areas, the responsive wrapper, and the
 * words for a count of parcels. Each chart owns only its layout.
 */

/** The histograms' plot height: the "Numerical multiple" frame, and Widget03's two sides together. */
export const HISTOGRAM_HEIGHT = 145;
/** The category columns' height, "Categorical multiple" frame: the count line, a gap, then the bar. */
export const COLUMNS_HEIGHT = 98;
/** The solid cap at a bar's far end. */
export const CAP_HEIGHT = 4;
export const RADIUS = 2;
/** The tick row under a histogram's baseline: one text line of 12px type. */
export const TICK_ROW = 18;

/**
 * A tick on an edge of the scale hugs it so no label spills out of the card; the rest
 * centre on their tick — a stepped scale's ticks sit half a bin in from the edges, so
 * they centre too.
 */
function tickAnchor(tick: number, min: number, max: number): 'start' | 'middle' | 'end' {
  if (tick <= min) return 'start';
  if (tick >= max) return 'end';

  return 'middle';
}

export function parcelCount(count: number): string {
  return count === 1 ? '1 parcela' : `${count} parcelas`;
}

/** The width a chart is laid out at before its card has been measured: the design's card. */
const NOMINAL_WIDTH = 341;

/**
 * The chart at the width its card gives it. Presentational: every card lists its
 * readings for assistive tech itself, so the drawing is hidden from it.
 *
 * The measured width is a layout hint, not a size: the SVGs draw into a `viewBox` of it
 * and fill their card with CSS, so when the card changes width without a measurement
 * — the report, laid out for paper while the page keeps its screen width — the drawing
 * scales with the card instead of running past it. The box has no height of its own: it
 * is the drawing's, so a scaled drawing still ends inside its card, axis included. The
 * nominal width covers the first paint for the same reason.
 *
 * Measured with the hook, not `<ParentSize>`: that component draws inside an absolute,
 * clipping layer, so its box needs a set height and would hide a drawing taller than it.
 */
export function Responsive({ children }: Readonly<{ children: (width: number) => ReactNode }>) {
  const { parentRef, width } = useParentSize({
    debounceTime: 50,
    initialSize: { width: NOMINAL_WIDTH },
    ignoreDimensions: ['height', 'top', 'left'],
  });

  return (
    <div ref={parentRef} aria-hidden>
      {width > 0 ? children(width) : null}
    </div>
  );
}

/** The SVG's sizing: its `viewBox` is the measured width, its box the card's (see `Responsive`). */
export const SVG_CLASS = 'block h-auto w-full overflow-visible';

type AxisTicksProps = {
  ticks: number[];
  /** The tick's place along the width. */
  x: (tick: number) => number;
  /** The text's bottom edge. */
  y: number;
  min: number;
  max: number;
};

/** The scale's ticks under a baseline, the ones on the edges hugging them so nothing spills out. */
export function AxisTicks({ ticks, x, y, min, max }: Readonly<AxisTicksProps>) {
  return ticks.map((tick) => (
    <text
      key={tick}
      x={x(tick)}
      y={y}
      textAnchor={tickAnchor(tick, min, max)}
      dominantBaseline="text-after-edge"
      className="fill-muted-foreground text-[12px]"
    >
      {formatTick(tick)}
    </text>
  ));
}

export type HitArea = {
  key: string | number;
  x: number;
  width: number;
  label: ReactNode;
  /** Where in the plot the tooltip sits above, in plot pixels; the top of the area when left out. */
  anchor?: number;
};

/** One transparent hit area per bin or column, the full plot height, so an empty one answers too. */
export function HitAreas({ areas, height }: Readonly<{ areas: HitArea[]; height: number }>) {
  return (
    // The readings are read-only: moving off a column closes its tooltip, so the next opens.
    <TooltipProvider disableHoverableContent>
      {areas.map((area) => (
        <Tooltip key={area.key}>
          <TooltipTrigger asChild>
            <rect x={area.x} y={0} width={area.width} height={height} fill="transparent" />
          </TooltipTrigger>
          {/* A negative offset pulls the tooltip down from the area's top to its anchor. */}
          <TooltipContent side="top" sideOffset={4 - (area.anchor ?? 0)}>
            {area.label}
          </TooltipContent>
        </Tooltip>
      ))}
    </TooltipProvider>
  );
}

/** Which way a bar's body fades: away from a cap on top (down) or on the bottom (up). */
type Fade = 'down' | 'up';

/** The `fill` of a bar body fading in `fade` direction from `tone` (`ToneGradients` defines it). */
function toneFill(gradientId: string, tone: RiskTone, fade: Fade = 'down'): string {
  return `url('#${gradientId}-${tone}-${fade}')`;
}

/** The gradients `toneFill` names, one per tone and direction, to put in the SVG's `<defs>`. */
export function ToneGradients({ id }: Readonly<{ id: string }>) {
  return (
    <defs>
      {TONES.flatMap((tone) =>
        (['down', 'up'] as const).map((fade) => (
          <linearGradient
            key={`${tone}-${fade}`}
            id={`${id}-${tone}-${fade}`}
            x1="0"
            y1={fade === 'down' ? '0' : '1'}
            x2="0"
            y2={fade === 'down' ? '1' : '0'}
          >
            <stop offset="0" style={{ stopColor: TONE_COLOR[tone] }} />
            <stop offset="1" style={{ stopColor: 'var(--card)' }} />
          </linearGradient>
        )),
      )}
    </defs>
  );
}

type CappedBarProps = {
  y: number;
  width: number;
  /** The whole bar, cap included. */
  height: number;
  tone: RiskTone;
  /** Where the cap sits: on top of a bar standing up, under one hanging down. */
  capAt?: 'top' | 'bottom';
  gradientId: string;
};

/** A printed bar body's strength: solid, so it reads filled on paper without the card behind. */
const PRINT_BODY_OPACITY = 0.35;

/**
 * One bar as the designs draw it: the body fading into the card away from a solid cap.
 * Printed, the body is a solid fill in its tone instead: the gradient fades into the
 * card's fill, which the report drops, and some print engines (Safari's) lose gradient
 * stops set through CSS variables, which left bars looking empty.
 */
export function CappedBar({
  y,
  width,
  height,
  tone,
  capAt = 'top',
  gradientId,
}: Readonly<CappedBarProps>) {
  return (
    <>
      <Bar
        y={y}
        width={width}
        height={height}
        rx={RADIUS}
        fill={toneFill(gradientId, tone, capAt === 'top' ? 'down' : 'up')}
        opacity={0.2}
        className="print:hidden"
      />
      <Bar
        y={y}
        width={width}
        height={height}
        rx={RADIUS}
        style={{ fill: TONE_COLOR[tone] }}
        opacity={PRINT_BODY_OPACITY}
        className="hidden print:inline"
      />
      <Bar
        y={capAt === 'top' ? y : y + height - CAP_HEIGHT}
        width={width}
        height={CAP_HEIGHT}
        rx={RADIUS}
        style={{ fill: TONE_COLOR[tone] }}
      />
    </>
  );
}

/** The 1px line the bars stand on, drawn on the half pixel so it stays crisp. */
export function Baseline({ y, width }: Readonly<{ y: number; width: number }>) {
  return (
    <line
      x1={0}
      x2={width}
      y1={y + 0.5}
      y2={y + 0.5}
      className="stroke-foreground"
      strokeWidth={1}
    />
  );
}
