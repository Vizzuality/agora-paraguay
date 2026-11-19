import { useAtom } from 'jotai';
import { Check, Search, SquarePen } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  matchesIndicator,
  pickerEntries,
  selectableIndicators,
  visibleIndicatorIds,
} from '@/lib/analysis/indicator-picker';
import { useApplicableIndicators } from '@/lib/analysis/use-applicable-indicators';
import { useExposureIndicators } from '@/lib/analysis/use-exposure-widgets';
import { errorReason } from '@/lib/api/http';
import type { Indicators, IndicatorsRiesgo, Riesgo } from '@/lib/api/metadata/schemas';
import { cn } from '@/lib/utils';
import { selectedIndicatorIdsAtom } from '@/store/analysis';

type PickerSourceProps = {
  /** Extra classes for the trigger button (the side column sizes it). */
  className?: string;
};

/** The riesgo pages' picker: the indicators that apply to the analysed parcels. */
export function RiskIndicatorPicker({
  riesgo,
  className,
}: Readonly<PickerSourceProps & { riesgo: Riesgo }>) {
  const { indicators, indicatorsError } = useApplicableIndicators(riesgo);

  return (
    <IndicatorPicker
      riesgo={riesgo}
      indicators={indicators && selectableIndicators(indicators, riesgo)}
      error={indicatorsError}
      className={className}
    />
  );
}

/** Exposición climática's picker: its own indicator list, nothing to analyse first. */
export function ExposureIndicatorPicker({ className }: Readonly<PickerSourceProps>) {
  const { indicators, selectable } = useExposureIndicators();

  return (
    <IndicatorPicker
      riesgo="exposicion_climatica"
      indicators={selectable}
      error={indicators.error}
      className={className}
    />
  );
}

type IndicatorPickerProps = PickerSourceProps & {
  riesgo: IndicatorsRiesgo;
  /** The checklist, already narrowed to what the page lets the user pick. */
  indicators: Indicators | undefined;
  error: Error | null | undefined;
};

/**
 * Personalizar indicadores: a popover with a search box and the page's measured
 * indicators as a checklist; checked ones are the cards on the page. General info is not
 * listed: it is always shown. Renders inside `<ClientOnly>` (it reads the analysis atoms).
 */
function IndicatorPicker({ riesgo, indicators, error, className }: Readonly<IndicatorPickerProps>) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          className={cn('h-11 rounded-2xl px-8 font-normal', className)}
          // The short label shows; the name stays the full one.
          aria-label="Personalizar indicadores"
        >
          <SquarePen aria-hidden />
          Personalizar
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-auto min-w-[200px] overflow-clip rounded-lg p-0 shadow-[0px_12px_22px_0px_rgba(0,0,0,0.1)]"
      >
        {indicators ? (
          <IndicatorChecklist riesgo={riesgo} indicators={indicators} />
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

function IndicatorChecklist({
  riesgo,
  indicators,
}: Readonly<{ riesgo: IndicatorsRiesgo; indicators: Indicators }>) {
  const [selection, toggle] = useAtom(selectedIndicatorIdsAtom);
  const selected = selection[riesgo];
  const [query, setQuery] = useState('');
  const listId = useId();

  const visibleIds = visibleIndicatorIds(indicators, selected);
  // A crop's six projection scenarios are one row, as they are one chart.
  const matching = pickerEntries(indicators).filter(
    (entry) =>
      matchesIndicator(entry, query) ||
      entry.ids.some((id) => matchesIndicator({ id, name: '' }, query)),
  );

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

      {/* Rows beyond the cap scroll, and fade into the surface where they are cut. The
          border sits on the wrapper so the mask on the list cannot fade it. */}
      <div className="border-t">
        <ul
          id={listId}
          aria-label="Indicadores"
          className="scroll-fade-y max-h-80 overflow-y-auto px-1 py-1.5"
        >
          {matching.map((entry) => {
            const checked = entry.ids.every((id) => visibleIds.includes(id));

            return (
              <li key={entry.id}>
                {/* A real checkbox, visually hidden: the check glyph is the only state cue
                  in the design, and the label row is the click target. */}
                <label className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground has-focus-visible:bg-accent">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => toggle({ riesgo, indicators, ids: entry.ids })}
                  />
                  <Check aria-hidden className={cn('size-4 shrink-0', !checked && 'invisible')} />
                  <span className="min-w-0 flex-1 wrap-break-word">{entry.name}</span>
                </label>
              </li>
            );
          })}

          {matching.length === 0 && (
            <li className="px-2 py-1.5 text-sm text-muted-foreground">Sin resultados</li>
          )}
        </ul>
      </div>
    </>
  );
}
