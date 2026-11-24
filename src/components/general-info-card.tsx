import { Fragment } from 'react';

import { InfoTip } from '@/components/info-tip';
import { WidgetCard } from '@/components/widget-card';
import { LIST_SEPARATOR } from '@/lib/analysis/indicator-cards';
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
  /** Off under a section already titled Información de contexto (productivo's Todas). */
  titled?: boolean;
  className?: string;
};

/**
 * Widget for the parcel's context — station, crop, phenology — as one list of
 * facts, the context heading the content column. These are not risks, so no
 * figure and no ruler; the heading sits right in the card, no subtitle, and the facts
 * flow top to bottom through as many columns as the card's width holds.
 */
export function GeneralInfoCard({
  items,
  titled = true,
  className,
}: Readonly<GeneralInfoCardProps>) {
  return (
    <WidgetCard className={cn('min-h-0 justify-start gap-2', className)}>
      {titled && (
        <h3 className="text-[16px] leading-[20.3px] tracking-[0.28px]">Información de contexto</h3>
      )}

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
            {item.list ? <ListValue value={item.value} /> : <SeparatedValue value={item.value} />}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * A fact's values under Todas, joined by a middle dot (`LIST_SEPARATOR`). Screen readers
 * would read the dot as "punto medio" or run the values together, so it is hidden from
 * them and a semicolon, read as a pause, stands in: "Pindo; Santa Teresa".
 */
function SeparatedValue({ value }: Readonly<{ value: string }>) {
  const values = value.split(LIST_SEPARATOR);

  if (values.length === 1) return value;

  // Index keys: the same reading can repeat across stations ("23 °C · 23 °C").
  return values.map((part, index) => (
    <Fragment key={index}>
      {index > 0 && (
        <>
          <span aria-hidden="true">{LIST_SEPARATOR}</span>
          <span className="sr-only">; </span>
        </>
      )}
      {part}
    </Fragment>
  ));
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
