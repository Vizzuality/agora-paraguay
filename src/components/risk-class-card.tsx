import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { toneOf, type IndicatorCard, type RiskTone } from '@/lib/analysis/indicator-cards';
import { rulerSegments } from '@/lib/analysis/risk-ruler';
import { cn } from '@/lib/utils';

/** What `indicatorCards()` produces, minus the id the list keys on. */
type RiskClassCardProps = Omit<IndicatorCard, 'id'> & {
  /** Top-right slot. Hidden in the design for now, kept for parity with `StatCard`. */
  action?: ReactNode;
  className?: string;
};

/**
 * Widget tile for a classed indicator: a label, the class as the large figure, a ruler
 * marking where the class falls on the scale, and a caption qualifying it.
 *
 * Light surface (`bg-card`), unlike `StatCard`'s navy `bg-widget` — the two are
 * different tiles in the design, not variants of one.
 */
export function RiskClassCard({
  label,
  level,
  position,
  caption,
  action,
  className,
}: RiskClassCardProps) {
  return (
    <Card
      className={cn(
        'min-h-[254px] justify-between gap-6 rounded-3xl border-0 bg-card p-6 text-card-foreground shadow-none backdrop-blur-[4px]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[16px] leading-[20.3px] tracking-[0.28px] text-balance">{label}</h3>
        {action}
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-[66px] leading-normal font-extralight tracking-[0.408px]">{level}</p>
        {position !== undefined && <RiskRuler position={position} />}
        {caption && <p className="text-[12px] leading-[17.4px] text-muted-foreground">{caption}</p>}
      </div>
    </Card>
  );
}

/** Track and marker colour per class: blue, orange, red (`--risk-*` in globals.css). */
const TONE_CLASS: Record<RiskTone, string> = {
  low: 'bg-risk-low',
  medium: 'bg-risk-medium',
  high: 'bg-risk-high',
};

/**
 * Presentational: the class is printed right above it, so exposing the ruler would
 * announce the same reading twice (same reasoning as `Meter`).
 */
function RiskRuler({ position }: Readonly<{ position: number }>) {
  const { before, after } = rulerSegments(position);
  const tone = TONE_CLASS[toneOf(position)];

  return (
    <div aria-hidden className="flex w-full items-center gap-[2px] p-px">
      <span
        className={cn('h-2 min-w-0 rounded-[2px] opacity-50', tone)}
        style={{ flexGrow: before }}
      />
      <span className={cn('h-6 w-1 shrink-0 rounded-[2px]', tone)} />
      <span
        className="h-2 min-w-0 rounded-[2px] bg-muted-foreground opacity-20"
        style={{ flexGrow: after }}
      />
    </div>
  );
}
