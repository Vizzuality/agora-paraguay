import { InfoTip } from '@/components/info-tip';
import { WidgetCard } from '@/components/widget-card';
import { cn } from '@/lib/utils';

export type GeneralInfoItem = {
  id: string;
  label: string;
  /** The metadata's description, behind the label's info icon. */
  description?: string;
  value: string;
};

type GeneralInfoCardProps = {
  /** Label/value pairs, in the order to list them. */
  items: GeneralInfoItem[];
  className?: string;
};

/**
 * Widget for the parcel's context — station, crop, phenology — as one list of
 * facts, the analysis summary heading the content column. These are not risks, so no
 * figure and no ruler; the heading sits right in the card, no subtitle, and the facts
 * flow top to bottom through as many columns as the card's width holds.
 */
export function GeneralInfoCard({ items, className }: Readonly<GeneralInfoCardProps>) {
  return (
    <WidgetCard className={cn('min-h-0 justify-start gap-2', className)}>
      <h3 className="text-[16px] leading-[20.3px] tracking-[0.28px]">Resumen del análisis</h3>

      <dl className="columns-[172px] gap-8">
        {items.map((item) => (
          <div key={item.id} className="mb-4 flex break-inside-avoid flex-col gap-1">
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              {item.label}
              <InfoTip
                description={item.description}
                subject={item.label}
                className="text-accent-foreground"
              />
            </dt>
            <dd className="text-base">{item.value}</dd>
          </div>
        ))}
      </dl>
    </WidgetCard>
  );
}
