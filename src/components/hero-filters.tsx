import { useSetAtom } from 'jotai';
import { CalendarIcon } from 'lucide-react';
import { useId, useState } from 'react';
import { es } from 'react-day-picker/locale';

import { InfoTip } from '@/components/info-tip';
import { Calendar } from '@/components/ui/calendar';
import { FLOATING_FIELD_CLASS, FloatingLabel } from '@/components/ui/floating-label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { describeWithFilters, formatIsoDate } from '@/lib/analysis/describe';
import {
  dateBounds,
  heroFieldSpansRow,
  isoToDate,
  orderHeroFilters,
  todayIso,
} from '@/lib/analysis/filters';
import { useHeroFilters } from '@/lib/analysis/use-hero-filters';
import type { AnalysisOption, Filter, Riesgo } from '@/lib/api/metadata/schemas';
import { cn } from '@/lib/utils';
import { setAnalysisFilterAtom } from '@/store/analysis';

/**
 * One field per filter `GET /api/parcels/filters/` returns: a dropdown for a category, a
 * date input for a date; Cultivo y fechas holds them. They load client-side after
 * hydration like every query here, so there is a first render without them: two disabled
 * placeholder selects hold the layout instead of a Suspense boundary the rest of the app
 * does not use.
 */
export function HeroFilters({ riesgo }: Readonly<{ riesgo: Riesgo }>) {
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
    <div className="grid gap-x-3 gap-y-6 md:grid-cols-2 print:hidden">
      {filters ? (
        orderHeroFilters(filters).map((filter, index, ordered) => (
          <HeroField
            key={filter.id}
            filter={filter}
            description={
              filter.description && describeWithFilters(filter.description, filters, resolved)
            }
            value={resolved[filter.id] ?? ''}
            {...(filter.field_type.type === 'date' ? dateBounds(filter.id, resolved) : {})}
            onChange={(value) => setFilter({ id: filter.id, value })}
            className={heroFieldSpansRow(index, ordered.length) ? 'md:col-span-2' : undefined}
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
  min,
  max,
  onChange,
  className,
}: Readonly<{
  filter: Filter;
  /** `filter.description` with its filter references resolved (`describeWithFilters`). */
  description?: string;
  value: string;
  /** The days a date field offers. */
  min?: string;
  max?: string;
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
          min={min}
          max={max}
          onChange={onChange}
          className={className}
        />
      );
  }
}

/** A date filter, ISO `YYYY-MM-DD` in and out; the calendar offers only min–max. */
function HeroDate({
  label,
  description,
  value,
  min,
  max,
  onChange,
  className,
}: Readonly<{
  label: string;
  description?: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
  className?: string;
}>) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const selected = value ? isoToDate(value) : undefined;
  const first = min ? isoToDate(min) : undefined;
  const last = max ? isoToDate(max) : undefined;

  return (
    <div className={cn('relative', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            data-value={value}
            className={cn(
              FLOATING_FIELD_CLASS,
              'flex items-center justify-between border text-left',
            )}
          >
            {formatIsoDate(value)}
            <CalendarIcon aria-hidden className="size-4 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            locale={es}
            captionLayout="dropdown"
            selected={selected}
            defaultMonth={selected}
            startMonth={first}
            endMonth={last}
            disabled={[...(first ? [{ before: first }] : []), ...(last ? [{ after: last }] : [])]}
            onSelect={(date) => {
              if (!date) return;
              onChange(todayIso(date));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <FloatingLabel htmlFor={id}>
        {label}
        <InfoTip description={description} subject={label} />
      </FloatingLabel>
    </div>
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
