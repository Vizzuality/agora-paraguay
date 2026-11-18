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
 * facts, the context heading the content column. These are not risks, so no
 * figure and no ruler; the heading sits right in the card, no subtitle, and the facts
 * sit side by side across the card's width, wrapping onto new rows.
 */
export function GeneralInfoCard({ items, className }: Readonly<GeneralInfoCardProps>) {
  return (
    <WidgetCard className={cn('min-h-0 justify-start gap-2', className)}>
      <h3 className="text-[16px] leading-[20.3px] tracking-[0.28px]">Información de contexto</h3>

      <GeneralInfoList items={items} />
    </WidgetCard>
  );
}

/** The facts alone, side by side across the full width, wrapping onto new rows, never their text. */
export function GeneralInfoList({ items }: Readonly<{ items: GeneralInfoItem[] }>) {
  return (
    <dl className="flex flex-wrap gap-x-8 gap-y-4">
      {items.map((item) => (
        <div key={item.id} className="flex grow break-inside-avoid flex-col gap-1">
          <dt className="flex items-start justify-between gap-2 text-sm whitespace-nowrap text-muted-foreground">
            {item.label}
            <InfoTip
              description={item.description}
              subject={item.label}
              className="mt-0.5 text-accent-foreground"
            />
          </dt>
          {/* A list under Todas reads one element a line. */}
          <dd className="text-base whitespace-pre">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
