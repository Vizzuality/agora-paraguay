import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import { cn } from "@/lib/utils";

type StatCardProps = {
  /** Sentence case, no trailing colon. */
  label: string;
  /** Pre-formatted for display — the caller owns units and compaction. */
  value: string;
  /** Sits under the value, or under the meter when there is one. */
  caption?: string;
  /** Renders a meter between value and caption. 0–100. */
  meter?: { value: number; color?: string };
  /** Top-right slot, typically a layer visibility toggle. */
  action?: ReactNode;
  className?: string;
};

/**
 * Stat tile: a label, one large number, and optionally a meter.
 *
 * The value uses the font's proportional figures rather than tabular ones. Tabular
 * gives every digit the width of a zero, which reads loose at display sizes; it is
 * for columns of numbers that must align, not for a standalone figure.
 */
export function StatCard({ label, value, caption, meter, action, className }: StatCardProps) {
  return (
    <Card className={cn("gap-3 px-5 py-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm leading-snug font-semibold text-balance">{label}</h3>
        {action}
      </div>

      <p className="text-4xl leading-none font-bold tracking-tight">{value}</p>

      {meter && <Meter value={meter.value} color={meter.color} />}

      {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
    </Card>
  );
}
