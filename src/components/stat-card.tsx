import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StatCardProps = {
  /** Sentence case, no trailing colon. */
  label: string;
  /** Pre-formatted for display — the caller owns units and compaction. */
  value: string;
  /** Qualifies the value: share, period, source. */
  caption?: string;
  /** Top-right slot, typically a layer visibility toggle. */
  action?: ReactNode;
  className?: string;
};

/**
 * Widget tile: a label, one large number, and a caption qualifying it.
 *
 * Geometry follows the AGORA design (Figma node 46:7042) — 24px radius and padding,
 * the label pinned to the top and the number to the bottom. The fixed minimum height
 * is what creates the gap between them; without it `justify-between` has nothing to
 * distribute and the tile collapses to its content.
 *
 * The value uses the font's proportional figures rather than tabular ones. Tabular
 * gives every digit the width of a zero, which reads loose at display sizes; it is
 * for columns of numbers that must align, not for a standalone figure.
 */
export function StatCard({ label, value, caption, action, className }: StatCardProps) {
  return (
    <Card
      className={cn(
        'min-h-[254px] justify-between gap-6 rounded-[24px] border-0 bg-widget p-6 text-widget-foreground shadow-none',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[16px] leading-[20.3px] tracking-[0.28px] text-balance">{label}</h3>
        {action}
      </div>

      <div className="flex flex-col">
        <p className="text-[66px] leading-none font-extralight tracking-[0.408px]">{value}</p>
        {caption && <p className="pt-2 text-[12px] leading-[17.4px] opacity-70">{caption}</p>}
      </div>
    </Card>
  );
}
