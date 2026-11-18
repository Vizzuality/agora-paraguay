/*
 * A searchable picker is the ARIA combobox pattern: a native <select> takes no search box
 * and <option> only behaves inside one, so the roles are written out.
 */
/* oxlint-disable jsx-a11y/prefer-tag-over-role */
import { useAtomValue, useSetAtom } from 'jotai';
import { CheckIcon, ChevronDownIcon, SearchIcon } from 'lucide-react';
import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';

import { FLOATING_FIELD_CLASS, FloatingLabel } from '@/components/ui/floating-label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { parcelLabel } from '@/lib/analysis/parcel-label';
import { searchParcels } from '@/lib/analysis/parcel-search';
import { cn } from '@/lib/utils';
import { activeParcelIdAtom, activeParcelTabAtom, analysedParcelIdsAtom } from '@/store/analysis';

/**
 * Parcela: the analysed parcels as "Parcela N", searchable by label or cadastral id. Under
 * Todas nothing is picked and the label rests in the field; reopened, the picked parcel
 * heads the list. Reads atoms: render inside `<ClientOnly>`.
 */
export function ParcelPicker() {
  const parcels = useAtomValue(analysedParcelIdsAtom);
  const activeId = useAtomValue(activeParcelIdAtom);
  const setActiveTab = useSetAtom(activeParcelTabAtom);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const listId = `${id}-list`;
  const optionId = (parcel: string) => `${id}-${parcel}`;
  const matches = searchParcels(parcels, query);
  const highlightedParcel = matches[highlighted];

  const openChange = (next: boolean) => {
    setOpen(next);
    if (!next) return;
    setQuery('');
    setHighlighted(Math.max(0, activeId === null ? 0 : parcels.indexOf(activeId)));
  };

  const choose = (parcel: string) => {
    setActiveTab(parcel);
    setOpen(false);
  };

  // Reopened, the picked parcel heads the list rather than sitting wherever it scrolled to.
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const picked = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (list && picked) list.scrollTop = picked.offsetTop - list.clientTop;
  }, [open]);

  // Keyboard moves keep the highlighted row in view.
  useEffect(() => {
    if (!open || highlightedParcel === undefined) return;
    document.getElementById(`${id}-${highlightedParcel}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, highlightedParcel, id]);

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setHighlighted((index) => Math.min(Math.max(index + step, 0), matches.length - 1));
    } else if (event.key === 'Enter' && highlightedParcel !== undefined) {
      event.preventDefault();
      choose(highlightedParcel);
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
            // Empty under Todas: the floating label rests in the field (`field-empty`).
            data-placeholder={activeId === null ? '' : undefined}
            className={cn(
              FLOATING_FIELD_CLASS,
              'flex cursor-pointer items-center justify-between gap-2 border text-left whitespace-nowrap text-primary outline-none disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            <span className="truncate">
              {activeId === null ? '' : parcelLabel(activeId, parcels)}
            </span>
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
              aria-activedescendant={
                highlightedParcel === undefined ? undefined : optionId(highlightedParcel)
              }
              className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>

          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="Parcelas"
            className="scroll-fade-y relative max-h-72 overflow-y-auto"
          >
            {matches.length === 0 && (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">Sin resultados</p>
            )}
            {matches.map((parcel, index) => (
              <div
                key={parcel}
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
                className="relative flex cursor-pointer items-center rounded-sm py-1.5 pr-8 pl-2 text-sm select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
              >
                {parcelLabel(parcel, parcels)}
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
