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
 * facts. These are not risks, so no figure and no ruler; the heading sits right in the
 * card, no subtitle, and the list is not pinned to the bottom.
 */
export function GeneralInfoCard({ items, className }: Readonly<GeneralInfoCardProps>) {
  return (
    <WidgetCard className={cn('justify-start', className)}>
      <h3 className="text-[16px] leading-[20.3px] tracking-[0.28px]">Información general</h3>

      <dl className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col gap-0.5">
            <dt className="flex items-center gap-2 text-[12px] leading-[17.4px] text-muted-foreground">
              {item.label}
              <InfoTip
                description={item.description}
                subject={item.label}
                className="text-accent-foreground"
              />
            </dt>
            <dd className="text-[16px] leading-[20.3px] font-medium">{item.value}</dd>
          </div>
        ))}
      </dl>
    </WidgetCard>
  );
}
