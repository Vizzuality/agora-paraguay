import { useQuery } from '@tanstack/react-query';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { ArrowLeft, ArrowRight, List } from 'lucide-react';
import { useId, useLayoutEffect, useRef, useState } from 'react';

import { MiniMap } from '@/components/map/mini-map';
import { Button } from '@/components/ui/button';
import {
  FLOATING_CHIP_CLASS,
  FLOATING_FIELD_CLASS,
  FloatingLabel,
} from '@/components/ui/floating-label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { resolveFilterSelection } from '@/lib/analysis/filters';
import {
  nextScrollLeft,
  scrollEdges,
  type ScrollDirection,
} from '@/lib/analysis/parcel-tabs-scroll';
import { visibilityOf } from '@/lib/analysis/request';
import { metadataQueries } from '@/lib/api/metadata/queries';
import type { AnalysisOption, Filter, Riesgo } from '@/lib/api/metadata/schemas';
import { cn } from '@/lib/utils';
import { activeParcelTabAtom, analysisFiltersAtom, setAnalysisFilterAtom } from '@/store/analysis';

/**
 * The analysed parcels as tabs, and the filters the API offers for that side of the
 * analysis: `riesgo` picks the `visibility` the filters are asked for.
 */
export function AnalysisHero({ riesgo, parcels }: Readonly<{ riesgo: Riesgo; parcels: string[] }>) {
  return (
    <div className="flex flex-col gap-6 rounded-3xl bg-card p-6 lg:flex-row">
      <MiniMapThumbnail />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <ParcelTabs parcels={parcels} />

        <HeroFilters riesgo={riesgo} />
      </div>
    </div>
  );
}

/**
 * One field per filter `GET /api/parcels/filters/` returns: a dropdown for a category, a
 * date input for a date. Only this page asks for them. They load client-side after
 * hydration like every query here, so there is a first render without them: two disabled
 * placeholder selects hold the layout instead of a Suspense boundary the rest of the app
 * does not use.
 */
function HeroFilters({ riesgo }: Readonly<{ riesgo: Riesgo }>) {
  const { data: filters, error } = useQuery(
    metadataQueries.filters({ visibility: visibilityOf(riesgo) }),
  );
  const selected = useAtomValue(analysisFiltersAtom);
  const setFilter = useSetAtom(setAnalysisFilterAtom);
  const resolved = filters ? resolveFilterSelection(selected, filters) : {};

  if (error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        No se pudieron cargar los filtros: {error.message}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6">
      {filters ? (
        filters.map((filter) => (
          <HeroField
            key={filter.id}
            filter={filter}
            value={resolved[filter.id] ?? ''}
            onChange={(value) => setFilter({ id: filter.id, value })}
          />
        ))
      ) : (
        <>
          <HeroSelect label="Cargando…" options={[]} value="" onChange={() => {}} />
          <HeroSelect label="Cargando…" options={[]} value="" onChange={() => {}} />
        </>
      )}
    </div>
  );
}

/** The control a filter's `field_type` calls for. */
function HeroField({
  filter,
  value,
  onChange,
}: Readonly<{ filter: Filter; value: string; onChange: (value: string) => void }>) {
  const field = filter.field_type;

  switch (field.type) {
    case 'category':
      return (
        <HeroSelect label={filter.name} options={field.options} value={value} onChange={onChange} />
      );
    case 'date':
      return <HeroDate label={filter.name} value={value} onChange={onChange} />;
  }
}

/**
 * A date filter, ISO `YYYY-MM-DD` in and out (the API's `format`). A native date input
 * never shows a placeholder, so the label always sits on the border.
 */
function HeroDate({
  label,
  value,
  onChange,
}: Readonly<{ label: string; value: string; onChange: (value: string) => void }>) {
  const id = useId();

  return (
    <div className="relative">
      <input
        id={id}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(FLOATING_FIELD_CLASS, 'border')}
      />
      <FloatingLabel htmlFor={id}>{label}</FloatingLabel>
    </div>
  );
}

/** Satellite mini map in the thumbnail slot. The area figure arrives with the API. */
function MiniMapThumbnail() {
  return (
    <div className="relative h-64 min-w-0 flex-1 overflow-hidden rounded-md bg-muted lg:h-[335px]">
      <MiniMap />
      <div className="pointer-events-none absolute right-0 bottom-0 rounded-md bg-black/80 px-4 py-2 backdrop-blur">
        <span className="text-[36px] font-light tracking-[0.408px] text-white">17.5 ha</span>
      </div>
    </div>
  );
}

/**
 * Not Radix Tabs on purpose: `role="tab"` requires tab panels this page does not have.
 * A fieldset names the group; its legend, absolutely positioned, stops being a "rendered
 * legend" and becomes the same border chip the floating labels use.
 */
function ParcelTabs({ parcels }: Readonly<{ parcels: string[] }>) {
  const [storedIndex, setActiveIndex] = useAtom(activeParcelTabAtom);
  // Re-analysing a smaller selection can leave a stale index behind: clamp to the first.
  const activeIndex = storedIndex < parcels.length ? storedIndex : 0;

  const stripRef = useRef<HTMLDivElement>(null);
  // Where the strip is heading while a smooth scroll is in flight, so a second arrow
  // press builds on it instead of on the half-way `scrollLeft`.
  const pendingLeft = useRef<number | null>(null);
  const [{ atStart, atEnd }, setEdges] = useState({ atStart: true, atEnd: true });

  // Edge state feeds the arrows' `disabled`: recomputed on scroll, resize and tab changes.
  // Layout effect so the first paint already has the right arrow enabled (client-only tree).
  useLayoutEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;

    const update = () => {
      setEdges(scrollEdges(strip));
      if (pendingLeft.current !== null && Math.abs(strip.scrollLeft - pendingLeft.current) < 1) {
        pendingLeft.current = null;
      }
    };
    update();

    strip.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(strip);

    return () => {
      strip.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [parcels.length]);

  const scroll = (direction: ScrollDirection) => {
    const strip = stripRef.current;
    if (!strip) return;
    const left = nextScrollLeft(
      {
        scrollLeft: pendingLeft.current ?? strip.scrollLeft,
        clientWidth: strip.clientWidth,
        scrollWidth: strip.scrollWidth,
      },
      direction,
    );
    pendingLeft.current = left;
    strip.scrollTo({ left, behavior: 'smooth' });
  };

  return (
    <fieldset className="relative flex h-13 min-w-0 items-center gap-2 rounded-2xl border border-muted-foreground py-2 pr-1">
      <legend className={FLOATING_CHIP_CLASS}>Parcela</legend>
      <div className="relative min-w-0 flex-1">
        <ScrollArea viewportRef={stripRef}>
          {/* A list, so the analysed areas stay enumerable (the e2e suite reads them). */}
          <ul className="flex gap-5 px-4">
            {parcels.map((parcel, index) => (
              <li key={parcel} className="shrink-0">
                <button
                  type="button"
                  aria-current={index === activeIndex || undefined}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    'cursor-pointer py-2 text-sm whitespace-nowrap',
                    index === activeIndex
                      ? 'border-b-[3px] border-primary text-primary'
                      : 'text-accent-foreground',
                  )}
                >
                  {parcel}
                </button>
              </li>
            ))}
          </ul>
          {/* Mounting the horizontal bar is what enables x-overflow in Radix; the arrows
              and trackpad do the scrolling, so it stays invisible. */}
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>
        {!atEnd && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-card to-transparent"
          />
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={atStart}
        onClick={() => scroll('left')}
        aria-label="Parcelas anteriores"
        className="size-8 rounded-full"
      >
        <ArrowLeft />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Ver lista de parcelas"
        className="size-8 rounded-full"
      >
        <List />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={atEnd}
        onClick={() => scroll('right')}
        aria-label="Parcelas siguientes"
        className="size-8 rounded-full"
      >
        <ArrowRight />
      </Button>
    </fieldset>
  );
}

/**
 * `<FloatingLabel htmlFor>` gives the trigger its accessible name — the e2e suite locates
 * by role and name, never by test id. The label rests inside the field while empty
 * (options not loaded yet) and floats onto the border once a value resolves.
 */
function HeroSelect({
  label,
  options,
  value,
  onChange,
}: Readonly<{
  label: string;
  options: AnalysisOption[];
  value: string;
  onChange: (value: string) => void;
}>) {
  const id = useId();
  const loading = options.length === 0;

  return (
    <div className="relative">
      <Select value={value} onValueChange={onChange} disabled={loading}>
        {/* The label is the placeholder, so the value slot stays blank while empty. */}
        <SelectTrigger id={id} className={FLOATING_FIELD_CLASS}>
          <SelectValue placeholder=" " />
        </SelectTrigger>
        <FloatingLabel htmlFor={id}>{label}</FloatingLabel>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
