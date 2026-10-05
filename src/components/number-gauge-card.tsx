import { InfoTip } from '@/components/info-tip';
import { Card } from '@/components/ui/card';
import type { NumberGaugeWidget } from '@/lib/analysis/number-gauge';
import { formatNumber } from '@/lib/analysis/number-scale';
import { cn } from '@/lib/utils';

type NumberGaugeCardProps = Omit<NumberGaugeWidget, 'id'> & { className?: string };

/**
 * Widget for one parcel's open number (the "Numerical individual" design): the
 * indicator's name and unit, the figure large, and a track with the marker at the value's
 * place on the scale, the scale's ticks under it. Same light surface as `RiskClassCard`.
 */
export function NumberGaugeCard({
  label,
  description,
  unit,
  text,
  ticks,
  position,
  className,
}: NumberGaugeCardProps) {
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

      <div className="flex flex-col gap-1">
        <p
          data-slot="figure"
          className="text-[66px] leading-normal font-extralight tracking-[0.408px]"
        >
          {text}
          {unit && <span className="sr-only"> {unit}</span>}
        </p>
        {/* Presentational: the figure above already says the value (see `Meter`). */}
        <div aria-hidden className="flex flex-col gap-1">
          <div className="flex w-full items-center gap-[2px] p-px">
            <span
              className="h-2 min-w-0 rounded-[2px] bg-risk-medium opacity-50"
              style={{ flexGrow: position }}
            />
            <span className="h-6 w-1 shrink-0 rounded-[2px] bg-risk-medium" />
            <span
              className="h-2 min-w-0 rounded-[2px] bg-muted-foreground opacity-20"
              style={{ flexGrow: 100 - position }}
            />
          </div>
          <ul className="flex w-full justify-between text-[12px] leading-[17.4px] text-muted-foreground opacity-70">
            {ticks.map((tick) => (
              <li key={tick}>{formatNumber(tick)}</li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
