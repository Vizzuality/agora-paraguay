import { Fragment } from 'react';

import { InfoTip } from '@/components/info-tip';
import { WidgetCard } from '@/components/widget-card';
import { cn } from '@/lib/utils';

export type GeneralInfoItem = {
  id: string;
  label: string;
  /** The metadata's description, behind the label's info icon. */
  description?: string;
  value: string;
  /** A list (`Zafras_soja`): each element stays on one line. */
  list?: true;
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
 * flow top to bottom through as many columns as the card's width holds.
 */
export function GeneralInfoCard({ items, className }: Readonly<GeneralInfoCardProps>) {
  return (
    <WidgetCard className={cn('min-h-0 justify-start gap-2', className)}>
      <h3 className="text-[16px] leading-[20.3px] tracking-[0.28px]">Información de contexto</h3>

      <GeneralInfoList items={items} />
    </WidgetCard>
  );
}

/** The facts alone, top to bottom through as many columns as the width holds. */
export function GeneralInfoList({ items }: Readonly<{ items: GeneralInfoItem[] }>) {
  return (
    <dl className="columns-[172px] gap-8">
      {items.map((item) => (
        <div key={item.id} className="mb-4 flex break-inside-avoid flex-col gap-1">
          <dt className="flex items-start justify-between gap-2 text-sm text-muted-foreground">
            {item.label}
            <InfoTip
              description={item.description}
              subject={item.label}
              className="mt-0.5 text-accent-foreground"
            />
          </dt>
          {/* A list under Todas reads one element a line. */}
          <dd className="text-base whitespace-pre-line">
            {item.list ? <ListValue value={item.value} /> : item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * A list's text, each element unbroken ("2017-2018 (546 parcelas)"): one a line under
 * Todas, comma-separated on a parcel, where the line may break only after a comma.
 */
function ListValue({ value }: Readonly<{ value: string }>) {
  // Seasons are distinct within a list, so each line and element keys by its own text.
  return value.split('\n').map((line) => (
    <span key={line} className="block">
      {line.split(', ').map((element, index) => (
        <Fragment key={element}>
          {index > 0 && ', '}
          <span className="whitespace-nowrap">{element}</span>
        </Fragment>
      ))}
    </span>
  ));
}
