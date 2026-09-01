import { useAtom } from 'jotai';
import { ArrowLeft, ArrowRight, Calendar, ChevronDown, List } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RiesgoTab } from '@/routes/analisis';
import { activeParcelTabAtom } from '@/store/analysis';

export function AnalysisHero({ riesgo, parcels }: { riesgo: RiesgoTab; parcels: string[] }) {
  const fields = riesgo === 'sanitario' ? SANITARIO_FIELDS : PRODUCTIVO_FIELDS;

  return (
    <div className="flex flex-col gap-6 rounded-3xl bg-card p-6 lg:flex-row">
      <ThumbnailPlaceholder />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Parcela</span>
          <ParcelTabs parcels={parcels} />
        </div>

        <div className={cn('gap-6', riesgo === 'sanitario' ? 'grid grid-cols-2' : 'flex flex-col')}>
          {fields.map((field) => (
            <HeroField key={field.label} {...field} />
          ))}
        </div>
      </div>
    </div>
  );
}

type HeroFieldProps = {
  label: string;
  value: string;
  icon: 'calendar' | 'chevron';
};

const SANITARIO_FIELDS: HeroFieldProps[] = [
  { label: 'Fecha de siembra', value: '18/06/2026', icon: 'calendar' },
  { label: 'Fecha del análisis', value: '18/08/2026', icon: 'calendar' },
  { label: 'Cultivo', value: 'Soja', icon: 'chevron' },
  { label: 'Ciclo', value: 'Lorem ipsum', icon: 'chevron' },
];

const PRODUCTIVO_FIELDS: HeroFieldProps[] = [
  { label: 'Fecha de inicio', value: '01/01/2015', icon: 'calendar' },
  { label: 'Fecha fin', value: '01/07/2026', icon: 'calendar' },
];

/** Stand-in for the selection thumbnail — the real satellite image arrives with the API. */
function ThumbnailPlaceholder() {
  return (
    <div className="relative h-64 min-w-0 flex-1 rounded-md bg-muted lg:h-[335px]">
      <div className="absolute right-0 bottom-0 rounded-md bg-black/80 px-4 py-2 backdrop-blur">
        <span className="text-[36px] font-light tracking-[0.408px] text-white">17.5 ha</span>
      </div>
    </div>
  );
}

/** Not Radix Tabs on purpose: `role="tab"` requires tab panels this page does not have. */
function ParcelTabs({ parcels }: { parcels: string[] }) {
  const [storedIndex, setActiveIndex] = useAtom(activeParcelTabAtom);
  // Re-analysing a smaller selection can leave a stale index behind: clamp to the first.
  const activeIndex = storedIndex < parcels.length ? storedIndex : 0;

  return (
    <div className="flex h-11 items-center gap-2 rounded-2xl border border-border bg-background py-1 pr-1">
      <div className="relative min-w-0 flex-1">
        <div className="flex gap-5 overflow-x-auto px-4">
          {parcels.map((parcel, index) => (
            <button
              key={parcel}
              type="button"
              aria-current={index === activeIndex || undefined}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'shrink-0 py-2 text-sm whitespace-nowrap',
                index === activeIndex
                  ? 'border-b-[3px] border-primary text-primary'
                  : 'text-accent-foreground',
              )}
            >
              {parcel}
            </button>
          ))}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent"
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled
        aria-label="Parcelas anteriores"
        className="size-8 rounded-full bg-background"
      >
        <ArrowLeft />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Ver lista de parcelas"
        className="size-8 rounded-full bg-background"
      >
        <List />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Parcelas siguientes"
        className="size-8 rounded-full bg-background"
      >
        <ArrowRight />
      </Button>
    </div>
  );
}

/** A styled div, not a `readOnly` input: a focusable field that ignores typing reads as broken. */
function HeroField({ label, value, icon }: HeroFieldProps) {
  const Icon = icon === 'calendar' ? Calendar : ChevronDown;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base">
        <span>{value}</span>
        <Icon aria-hidden className="size-4 text-muted-foreground" />
      </div>
    </div>
  );
}
