import { useAtomValue, useSetAtom } from 'jotai';
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

import { InfoTip } from '@/components/info-tip';
import { MiniMap } from '@/components/map/mini-map';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { formatArea } from '@/lib/analysis/area';
import { describeWithFilters } from '@/lib/analysis/describe';
import { CROP_FILTER_ID, orderHeroFilters } from '@/lib/analysis/filters';
import { parcelLabel } from '@/lib/analysis/parcel-label';
import {
  nextScrollLeft,
  scrollEdges,
  scrollLeftForTab,
  type ScrollDirection,
} from '@/lib/analysis/parcel-tabs-scroll';
import { useHeroFilters } from '@/lib/analysis/use-hero-filters';
import { useParcelArea } from '@/lib/analysis/use-parcel-area';
import type { AnalysisOption, Filter, Riesgo } from '@/lib/api/metadata/schemas';
import { cn } from '@/lib/utils';
import { activeParcelIdAtom, activeParcelTabAtom, setAnalysisFilterAtom } from '@/store/analysis';

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
  const {
    filters: { data: filters, error },
    resolvedFilters,
  } = useHeroFilters(riesgo);
  const setFilter = useSetAtom(setAnalysisFilterAtom);
  const resolved = resolvedFilters ?? {};

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
        orderHeroFilters(filters).map((filter) => (
          <HeroField
            key={filter.id}
            filter={filter}
            description={
              filter.description && describeWithFilters(filter.description, filters, resolved)
            }
            value={resolved[filter.id] ?? ''}
            onChange={(value) => setFilter({ id: filter.id, value })}
            // The crop closes the grid on a row of its own.
            className={filter.id === CROP_FILTER_ID ? 'col-span-2' : undefined}
          />
        ))
      ) : (
        // Placeholder: two disabled selects hold the layout until the filters land.
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
  description,
  value,
  onChange,
  className,
}: Readonly<{
  filter: Filter;
  /** `filter.description` with its filter references resolved (`describeWithFilters`). */
  description?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}>) {
  const field = filter.field_type;

  switch (field.type) {
    case 'category':
      return (
        <HeroSelect
          label={filter.name}
          description={description}
          options={field.options}
          value={value}
          onChange={onChange}
          className={className}
        />
      );
    case 'date':
      return (
        <HeroDate
          label={filter.name}
          description={description}
          value={value}
          onChange={onChange}
          className={className}
        />
      );
  }
}

/**
 * A date filter, ISO `YYYY-MM-DD` in and out (the API's `format`). A native date input
 * never shows a placeholder, so the label always sits on the border.
 */
function HeroDate({
  label,
  description,
  value,
  onChange,
  className,
}: Readonly<{
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}>) {
  const id = useId();

  return (
    <div className={cn('relative', className)}>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(FLOATING_FIELD_CLASS, 'border')}
      />
      <FloatingLabel htmlFor={id}>
        {label}
        <InfoTip description={description} subject={label} />
      </FloatingLabel>
    </div>
  );
}

/**
 * Satellite mini map in the thumbnail slot, the open tab's area over it: the parcel's,
 * or the selection summed under Todas. Nothing until the analysis has answered it. The
 * same on both pages (`useParcelArea`).
 */
function MiniMapThumbnail() {
  const area = useParcelArea();

  return (
    <div className="relative h-64 min-w-0 flex-1 overflow-hidden rounded-md bg-muted lg:h-[335px]">
      <MiniMap />
      {area && (
        <div className="pointer-events-none absolute right-0 bottom-0 rounded-md bg-black/80 px-4 py-2 backdrop-blur">
          <span className="text-[36px] font-light tracking-[0.408px] text-white">
            {formatArea(area)}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Not Radix Tabs on purpose: `role="tab"` requires tab panels this page does not have.
 * A fieldset names the group; its legend, absolutely positioned, stops being a "rendered
 * legend" and becomes the same border chip the floating labels use.
 *
 * Todas — the whole selection — comes first, then one tab per analysed parcel; a single
 * parcel has nothing to combine, so it stands alone without Todas. Three ways to open a
 * tab: clicking it, picking it in the dropdown, or clicking its parcel on the mini map
 * (`selectAnalysedParcelAtom`). The last two may target a tab out of view, so the strip
 * scrolls to bring it to the leading edge; a direct click never scrolls, since the tab
 * is already under the pointer. Layout per Figma 5540:7991.
 */
const ALL_TAB = 'Todas';

/** Tabs are keyed by parcel id; users read "Parcela N" (`parcelLabel`), Todas as is. */
function tabLabel(tab: string, parcels: string[]): string {
  return tab === ALL_TAB ? tab : parcelLabel(tab, parcels);
}

function ParcelTabs({ parcels }: Readonly<{ parcels: string[] }>) {
  const activeId = useAtomValue(activeParcelIdAtom);
  const setActiveTab = useSetAtom(activeParcelTabAtom);
  const hasAllTab = parcels.length > 1;
  const tabs = hasAllTab ? [ALL_TAB, ...parcels] : parcels;
  // With Todas at index 0 (`activeId === null`), a parcel's index is its position plus one.
  const offset = hasAllTab ? 1 : 0;
  const activeIndex = activeId === null ? 0 : parcels.indexOf(activeId) + offset;
  const setActiveIndex = (index: number) =>
    setActiveTab(hasAllTab && index === 0 ? null : parcels[index - offset]);

  const stripRef = useRef<HTMLDivElement>(null);
  // Where the strip is heading while a smooth scroll is in flight, so a second arrow
  // press builds on it instead of on the half-way `scrollLeft`.
  const pendingLeft = useRef<number | null>(null);
  // Raised by a click on a tab, so the scroll-to-tab effect below lets that one pass.
  const skipScroll = useRef(false);
  const [{ atStart, atEnd }, setEdges] = useState({ atStart: true, atEnd: true });

  useEffect(() => {
    if (skipScroll.current) {
      skipScroll.current = false;
      return;
    }

    const strip = stripRef.current;
    const tab = strip?.querySelectorAll('li')[activeIndex];
    if (!strip || !tab) return;

    const gutter = parseFloat(getComputedStyle(tab.parentElement as HTMLElement).paddingLeft) || 0;
    const left = scrollLeftForTab(tab.offsetLeft, strip, gutter);
    pendingLeft.current = left;
    strip.scrollTo({ left, behavior: 'smooth' });
  }, [activeIndex]);

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
      {/* Clipped on the fieldset's own radius, so a tab scrolled under the rounded
          corner does not show its underline outside the border. */}
      <div className="relative min-w-0 flex-1 overflow-hidden rounded-l-2xl">
        {!atStart && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-linear-to-r from-card to-transparent"
          />
        )}
        <ScrollArea viewportRef={stripRef}>
          {/* A list, so the analysed areas stay enumerable (the e2e suite reads them). */}
          <ul className="flex gap-5 px-4">
            {tabs.map((tab, index) => (
              <li key={tab} className="shrink-0">
                <button
                  type="button"
                  aria-current={index === activeIndex || undefined}
                  onClick={() => {
                    skipScroll.current = index !== activeIndex;
                    setActiveIndex(index);
                  }}
                  className={cn(
                    'cursor-pointer py-2 text-sm whitespace-nowrap',
                    index === activeIndex
                      ? 'border-b-[3px] border-primary text-primary'
                      : 'text-accent-foreground',
                  )}
                >
                  {tabLabel(tab, parcels)}
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
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-linear-to-l from-card to-transparent"
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
        className="size-8 rounded-full disabled:opacity-30"
      >
        <ArrowLeft />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={atEnd}
        onClick={() => scroll('right')}
        aria-label="Parcelas siguientes"
        className="size-8 rounded-full disabled:opacity-30"
      >
        <ArrowRight />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            // Nothing to choose from with a single tab.
            disabled={tabs.length === 1}
            aria-label="Ver lista de parcelas"
            className="size-8 rounded-full disabled:opacity-30"
          >
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* Radio items: the open tab is marked, and the menu reads as a single choice. */}
          <DropdownMenuRadioGroup
            value={String(activeIndex)}
            onValueChange={(value) => setActiveIndex(Number(value))}
          >
            {tabs.map((tab, index) => (
              <DropdownMenuRadioItem key={tab} value={String(index)}>
                {tabLabel(tab, parcels)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
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
  description,
  options,
  value,
  onChange,
  className,
}: Readonly<{
  label: string;
  description?: string;
  options: AnalysisOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}>) {
  const id = useId();
  const loading = options.length === 0;

  return (
    <div className={cn('relative', className)}>
      <Select value={value} onValueChange={onChange} disabled={loading}>
        {/* The label is the placeholder, so the value slot stays blank while empty. The
            trigger sizes itself through `data-size`, which outranks the shared `h-12`:
            restate it under the same variant so the select matches the date input. */}
        <SelectTrigger id={id} className={cn(FLOATING_FIELD_CLASS, 'data-[size=default]:h-12')}>
          <SelectValue placeholder=" " />
        </SelectTrigger>
        <FloatingLabel htmlFor={id}>
          {label}
          <InfoTip description={description} subject={label} />
        </FloatingLabel>
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
