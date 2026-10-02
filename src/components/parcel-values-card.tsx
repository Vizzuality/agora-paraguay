import { InfoTip } from '@/components/info-tip';
import { Card } from '@/components/ui/card';
import type { ParcelValuesWidget } from '@/lib/analysis/parcel-values';
import { cn } from '@/lib/utils';

type ParcelValuesCardProps = Omit<ParcelValuesWidget, 'id'> & { className?: string };

/**
 * Widget for an open number over the analysed parcels (Figma Widget01): the
 * indicator's name and unit, then one row per parcel — its id, a track filled on the
 * indicator's scale or relative to the largest parcel, and the figure. Same light surface
 * as `RiskClassCard`.
 */
export function ParcelValuesCard({
  label,
  description,
  unit,
  rows,
  className,
}: ParcelValuesCardProps) {
  return (
    <Card
      className={cn(
        'min-h-[254px] justify-between gap-6 rounded-3xl border-0 bg-card p-6 text-card-foreground shadow-none backdrop-blur-xs',
        className,
      )}
    >
      <div className="grid grid-cols-[auto_1fr] items-start gap-x-2">
        <h3 className="text-[16px] leading-[20.3px] tracking-[0.28px] text-balance">{label}</h3>
        <InfoTip
          description={description}
          subject={label}
          className="mt-0.5 text-accent-foreground"
        />
        {unit && (
          <p className="col-span-2 text-[12px] leading-[17.4px] text-muted-foreground opacity-70">
            {unit}
          </p>
        )}
      </div>

      <ul className="flex flex-col">
        {rows.map((row) => (
          <li key={row.parcelId} className="flex items-center gap-1">
            <span className="shrink-0 text-[12px] leading-[17.4px] font-semibold tabular-nums">
              {row.label}
            </span>
            {/* Presentational: the figure beside it already says the value (see `Meter`). */}
            <span aria-hidden className="flex min-w-0 flex-1 items-center gap-[2px] p-px">
              <span
                className="h-2 min-w-0 rounded-[2px] bg-risk-medium opacity-50"
                style={{ flexGrow: row.position }}
              />
              <span className="h-6 w-1 shrink-0 rounded-[2px] bg-risk-medium" />
              <span
                className="h-2 min-w-0 rounded-[2px] bg-muted-foreground opacity-20"
                style={{ flexGrow: 100 - row.position }}
              />
            </span>
            <span className="w-8 shrink-0 text-right text-[12px] leading-[17.4px] font-semibold tabular-nums">
              {row.text}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
