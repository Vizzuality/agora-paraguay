import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { Check, Search, SquarePen } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  matchesIndicator,
  selectableIndicators,
  visibleIndicatorIds,
} from '@/lib/analysis/indicator-picker';
import { errorReason } from '@/lib/api/http';
import { metadataQueries } from '@/lib/api/metadata/queries';
import type { Indicators } from '@/lib/api/metadata/schemas';
import { cn } from '@/lib/utils';
import { selectedIndicatorIdsAtom } from '@/store/analysis';

type IndicatorPickerProps = {
  riesgo: 'sanitario' | 'productivo';
};

/**
 * Personalizar indicadores: the title-row button opens a popover with a
 * search box and the riesgo's measured indicators as a checklist; checked ones are the
 * cards on the page. General info is not listed: it is always shown. Renders inside
 * `<ClientOnly>` (it reads the analysis atoms).
 */
export function IndicatorPicker({ riesgo }: IndicatorPickerProps) {
  const { data: indicators, error } = useQuery(metadataQueries.indicators({ riesgo }));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" className="h-11 rounded-2xl px-8 font-normal">
          <SquarePen aria-hidden />
          Personalizar indicadores
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-auto min-w-[200px] overflow-clip rounded-lg p-0 shadow-[0px_12px_22px_0px_rgba(0,0,0,0.1)]"
      >
        {indicators ? (
          <IndicatorChecklist indicators={selectableIndicators(indicators)} />
        ) : error ? (
          <p role="alert" className="px-3 py-2.5 text-sm text-destructive">
            No se pudieron cargar los indicadores: {errorReason(error)}
          </p>
        ) : (
          <p aria-live="polite" className="px-3 py-2.5 text-sm text-muted-foreground">
            Cargando indicadores…
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function IndicatorChecklist({ indicators }: Readonly<{ indicators: Indicators }>) {
  const [selected, toggle] = useAtom(selectedIndicatorIdsAtom);
  const [query, setQuery] = useState('');
  const listId = useId();

  const visibleIds = visibleIndicatorIds(indicators, selected);
  const matching = indicators.filter((indicator) => matchesIndicator(indicator, query));

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2.5 text-sm">
        <Search aria-hidden className="size-4 shrink-0 opacity-50" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar indicador"
          aria-label="Buscar indicador"
          aria-controls={listId}
          className="min-w-0 flex-1 bg-transparent outline-hidden placeholder:text-popover-foreground/50"
        />
      </div>

      <ul
        id={listId}
        aria-label="Indicadores"
        className="max-h-[300px] overflow-y-auto border-t px-1 py-1.5"
      >
        {matching.map((indicator) => {
          const checked = visibleIds.includes(indicator.id);

          return (
            <li key={indicator.id}>
              {/* A real checkbox, visually hidden: the check glyph is the only state cue
                  in the design, and the label row is the click target. */}
              <label className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground has-focus-visible:bg-accent">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => toggle({ indicators, id: indicator.id })}
                />
                <Check aria-hidden className={cn('size-4 shrink-0', !checked && 'invisible')} />
                <span className="min-w-0 flex-1 wrap-break-word">{indicator.name}</span>
              </label>
            </li>
          );
        })}

        {matching.length === 0 && (
          <li className="px-2 py-1.5 text-sm text-muted-foreground">Sin resultados</li>
        )}
      </ul>
    </>
  );
}
