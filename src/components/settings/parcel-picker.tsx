/*
 * A searchable picker is the ARIA combobox pattern: a native <select> takes no search box
 * and <option> only behaves inside one, so the roles are written out.
 */
/* oxlint-disable jsx-a11y/prefer-tag-over-role */
import { useAtomValue, useSetAtom } from 'jotai';
import { CheckIcon, ChevronDownIcon, SearchIcon } from 'lucide-react';
import { type KeyboardEvent, useCallback, useEffect, useId, useState } from 'react';

import { FLOATING_FIELD_CLASS, FloatingLabel } from '@/components/ui/floating-label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { parcelLabel } from '@/lib/analysis/parcel-label';
import { searchParcels } from '@/lib/analysis/parcel-search';
import { cn } from '@/lib/utils';
import { activeParcelIdAtom, activeParcelTabAtom, analysedParcelIdsAtom } from '@/store/analysis';

/** Todas as a picker option: every analysed parcel at once (`activeParcelTabAtom` null). */
const TODAS_LABEL = 'Todas';

/**
 * Parcela: Todas, then the analysed parcels as "Parcela N", searchable by label or
 * cadastral id. Todas is the field's value when it is the open tab, and only an option
 * while there is more than one parcel; reopened, the picked option heads the list.
 * Reads atoms: render inside `<ClientOnly>`.
 */
export function ParcelPicker() {
  const parcels = useAtomValue(analysedParcelIdsAtom);
  const activeId = useAtomValue(activeParcelIdAtom);
  const setActiveTab = useSetAtom(activeParcelTabAtom);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const id = useId();
  const listId = `${id}-list`;
  // `null` is Todas, as in `activeParcelTabAtom`.
  const optionId = (option: string | null) => `${id}-${option ?? 'todas'}`;
  const optionLabel = (option: string | null) =>
    option === null ? TODAS_LABEL : parcelLabel(option, parcels);
  const showTodas =
    parcels.length > 1 && TODAS_LABEL.toLowerCase().includes(query.trim().toLowerCase());
  const options: (string | null)[] = [
    ...(showTodas ? [null] : []),
    ...searchParcels(parcels, query),
  ];
  const highlightedOption = options.at(highlighted);

  const openChange = (next: boolean) => {
    setOpen(next);
    if (!next) return;
    setQuery('');
    // Unfiltered, the list is Todas then the parcels in order.
    setHighlighted(Math.max(0, activeId === null ? 0 : parcels.indexOf(activeId) + 1));
  };

  const choose = (option: string | null) => {
    setActiveTab(option);
    setOpen(false);
  };

  // Opened, the picked parcel heads the list. A ref callback, not an effect on `open`: the
  // popover's portal mounts the list a render after `open` flips.
  const headPicked = useCallback((list: HTMLDivElement | null) => {
    const picked = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (list && picked) list.scrollTop = picked.offsetTop;
  }, []);

  // Keyboard moves keep the highlighted row in view.
  const highlightedId = highlightedOption === undefined ? undefined : optionId(highlightedOption);
  useEffect(() => {
    if (!open || highlightedId === undefined) return;
    document.getElementById(highlightedId)?.scrollIntoView({ block: 'nearest' });
  }, [open, highlightedId]);

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setHighlighted((index) => Math.min(Math.max(index + step, 0), options.length - 1));
    } else if (event.key === 'Enter' && highlightedOption !== undefined) {
      event.preventDefault();
      choose(highlightedOption);
    }
  };

  return (
    <div className="relative min-w-0 flex-1">
      <Popover open={open} onOpenChange={openChange}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            disabled={parcels.length === 1}
            className={cn(
              FLOATING_FIELD_CLASS,
              'flex cursor-pointer items-center justify-between gap-2 border text-left whitespace-nowrap text-primary outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            <span className="truncate">{optionLabel(activeId)}</span>
            <ChevronDownIcon aria-hidden className="size-4 shrink-0 opacity-50 print:hidden" />
          </button>
        </PopoverTrigger>
        <FloatingLabel htmlFor={id}>Parcela</FloatingLabel>

        <PopoverContent
          align="start"
          className="flex w-(--radix-popover-trigger-width) min-w-48 flex-col gap-1 p-1"
        >
          <label className="flex items-center gap-2 border-b px-2 pb-1">
            <SearchIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setHighlighted(0);
              }}
              onKeyDown={onSearchKeyDown}
              placeholder="Buscar parcela"
              aria-label="Buscar parcela"
              aria-controls={listId}
              aria-activedescendant={highlightedId}
              className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>

          <div
            ref={headPicked}
            id={listId}
            role="listbox"
            aria-label="Parcelas"
            // No top fade: the picked parcel scrolls to the top and must read in full.
            className="scroll-fade-y relative max-h-72 overflow-y-auto [--scroll-fade-top:0px]!"
          >
            {options.length === 0 && (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">Sin resultados</p>
            )}
            {options.map((parcel, index) => (
              <div
                key={optionId(parcel)}
                id={optionId(parcel)}
                role="option"
                // Focus stays on the search box (`aria-activedescendant`); a click on a
                // row may still focus it, so it takes Enter and Space too.
                tabIndex={-1}
                aria-selected={parcel === activeId}
                data-highlighted={index === highlighted || undefined}
                onClick={() => choose(parcel)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return;
                  event.preventDefault();
                  choose(parcel);
                }}
                onMouseMove={() => setHighlighted(index)}
                className="relative flex cursor-pointer items-center rounded-sm py-1.5 pr-8 pl-2 text-sm select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-highlighted:ring-1 data-highlighted:ring-ring data-highlighted:ring-inset"
              >
                {optionLabel(parcel)}
                {parcel === activeId && (
                  <CheckIcon aria-hidden className="absolute right-2 size-4" />
                )}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
