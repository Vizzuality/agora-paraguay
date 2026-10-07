import { ParentSize } from '@visx/responsive';
import { Bar } from '@visx/shape';
import type { ReactNode } from 'react';

import { TONE_COLOR, TONES } from '@/components/charts/tones';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatNumber } from '@/lib/analysis/number-scale';
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

/**
 * The chart at the width its card gives it, `height` tall. Presentational: every card
 * lists its readings for assistive tech itself, so the drawing is hidden from it.
 */
export function Responsive({
  height,
  children,
}: Readonly<{ height: number; children: (width: number) => ReactNode }>) {
  return (
    <div aria-hidden>
      <ParentSize debounceTime={50} style={{ height }}>
        {({ width }) => (width > 0 ? children(width) : null)}
      </ParentSize>
    </div>
  );
}

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
      className="fill-muted-foreground text-[12px] opacity-70"
    >
      {formatNumber(tick)}
    </text>
  ));
}

export type HitArea = { key: string | number; x: number; width: number; label: ReactNode };

/** One transparent hit area per bin or column, the full plot height, so an empty one answers too. */
export function HitAreas({ areas, height }: Readonly<{ areas: HitArea[]; height: number }>) {
  return (
    <TooltipProvider>
      {areas.map((area) => (
        <Tooltip key={area.key}>
          <TooltipTrigger asChild>
            <rect x={area.x} y={0} width={area.width} height={height} fill="transparent" />
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={4}>
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

/** One bar as the designs draw it: the body fading into the card away from a solid cap. */
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
