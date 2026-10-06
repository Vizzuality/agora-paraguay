import { InfoTip } from '@/components/info-tip';
import { Card } from '@/components/ui/card';
import { formatSigned, type DeviationWidget } from '@/lib/analysis/deviation-widget';
import { formatNumber } from '@/lib/analysis/number-scale';
import { cn } from '@/lib/utils';

type DeviationCardProps = Omit<DeviationWidget, 'id'> & { className?: string };

/**
 * Widget for one parcel's signed deviation from a reference (the diverging Widget03
 * design): the indicator's name and unit, the figure large with its sign, and a track
 * with the reference in the middle — red to the left, blue to the right — the marker on
 * the side the sign puts it, in that side's colour. Under the track, the reference's own
 * value (the parcel's base production) with the track's ends either side of it in the
 * same unit; without a base, the deviation scale itself. Same light surface as
 * `RiskClassCard`.
 */
export function DeviationCard({
  label,
  description,
  unit,
  text,
  span,
  position,
  base,
  className,
}: Readonly<DeviationCardProps>) {
  const negative = position < 50;
  // The marker's place within its own half, 0–100 from the middle outwards.
  const within = Math.abs(position - 50) * 2;
  const side = negative ? 'bg-risk-high' : 'bg-risk-low';

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
        {/* Presentational: the figure above already says the value (see `RiskRuler`). */}
        <div aria-hidden className="flex flex-col gap-1">
          <div className="flex w-full items-center gap-[2px] p-px">
            {negative ? (
              <>
                <Half tone={side} marker={100 - within} />
                <span className="h-2 min-w-0 flex-1 rounded-[2px] bg-risk-low opacity-50" />
              </>
            ) : (
              <>
                <span className="h-2 min-w-0 flex-1 rounded-[2px] bg-risk-high opacity-50" />
                <Half tone={side} marker={within} />
              </>
            )}
          </div>
          <ul className="flex w-full justify-between text-[12px] leading-[17.4px] text-muted-foreground opacity-70">
            {scaleLabels(span, base).map((tick, index) => (
              <li key={tick} data-slot={index === 1 ? 'base' : undefined}>
                {tick}
              </li>
            ))}
          </ul>
        </div>
        <p className="sr-only">
          {base === null ? null : `Base: ${formatNumber(base)}${unit ? ` ${unit}` : ''}`}
        </p>
      </div>
    </Card>
  );
}

/** The three labels under the track: the base with the ends either side, else the deviation scale. */
function scaleLabels(span: number, base: number | null): string[] {
  if (base === null) return [formatSigned(-span), '0', formatSigned(span)];

  return [formatNumber(base - span), formatNumber(base), formatNumber(base + span)];
}

/** One half of the track with the marker at `marker` (0–100 from its left edge). */
function Half({ tone, marker }: Readonly<{ tone: string; marker: number }>) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-[2px]">
      <span
        className={cn('h-2 min-w-0 rounded-[2px] opacity-50', tone)}
        style={{ flexGrow: marker }}
      />
      <span className={cn('h-6 w-1 shrink-0 rounded-[2px]', tone)} />
      <span
        className={cn('h-2 min-w-0 rounded-[2px] opacity-50', tone)}
        style={{ flexGrow: 100 - marker }}
      />
    </span>
  );
}
