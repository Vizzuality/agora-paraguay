import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { CircleArrowRight, Undo2 } from 'lucide-react';

import { NO_PARCEL_INTERSECTION_MESSAGE } from '@/components/error-toast';
import { ActionCardButton } from '@/components/sidebar/action-card-button';
import { resolveAnalysisFilters } from '@/lib/analysis/filters';
import { analysisMutations } from '@/lib/api/analysis/queries';
import { metadataQueries } from '@/lib/api/metadata/queries';
import { parcelQueries } from '@/lib/api/parcels/queries';
import { applyToggles, selectedParcelIds } from '@/lib/map/parcel-selection';
import { analysisFiltersAtom, analysisResultAtom } from '@/store/analysis';
import { drawPolygonsAtom, restartSelectionAtom } from '@/store/draw';
import { startAnalysisAtom } from '@/store/mode';
import { toggledParcelIdsAtom } from '@/store/parcels';

/**
 * Step 2 of the selection: start over, or analyse the parcels the drawn or uploaded
 * areas selected. `filter_parcels` already ran when the areas landed
 * (`parcelQueries.filtered`, painted on the map), and the user may have flipped some by
 * clicking them; Analizar sends the parcels selected after those flips to the analysis
 * (`analyzeSelection`) and lands on riesgo sanitario, the public side, so the request
 * goes to `public`. Renders inside `<ClientOnly>` (it reads the draw atoms).
 */
export function ConfirmActions() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const toggled = useAtomValue(toggledParcelIdsAtom);
  const selectedFilters = useAtomValue(analysisFiltersAtom);
  const parcels = useQuery(parcelQueries.filtered(polygons));
  const restart = useSetAtom(restartSelectionAtom);
  const setResult = useSetAtom(analysisResultAtom);
  const startAnalysis = useSetAtom(startAnalysisAtom);
  const navigate = useNavigate();

  // The hero defaults double as the request's filters until the user opens the hero.
  const { data: options } = useQuery(metadataQueries.analysisOptions());

  const mutation = useMutation({
    ...analysisMutations.analyzeSelection(),
    // Entering the mode before navigating keeps the store consistent even if navigation
    // fails. `useMutation`-level so an unmount cannot skip it.
    onSuccess: (result) => {
      setResult(result);
      startAnalysis();
      void navigate({ to: '/analisis' });
    },
  });

  const parcelIds = parcels.data
    ? selectedParcelIds(applyToggles(parcels.data.results, toggled))
    : [];
  const noIntersection = parcels.isSuccess && parcelIds.length === 0;

  function analyze() {
    if (!options) return;

    mutation.mutate({
      visibility: 'public',
      parcelIds,
      filters: resolveAnalysisFilters(selectedFilters, options),
    });
  }

  return (
    <section aria-live="polite" className="flex w-full flex-col gap-2">
      <div className="grid grid-cols-2 gap-1.5">
        <ActionCardButton icon={Undo2} onClick={() => restart()} disabled={mutation.isPending}>
          Reiniciar
        </ActionCardButton>

        <ActionCardButton
          variant="default"
          icon={CircleArrowRight}
          disabled={parcelIds.length === 0 || !options || mutation.isPending}
          onClick={analyze}
        >
          {mutation.isPending ? 'Analizando…' : 'Analizar'}
        </ActionCardButton>
      </div>

      {parcels.isError && (
        <p className="text-sm text-destructive">
          No se pudieron cargar las parcelas: {parcels.error.message}
        </p>
      )}

      {noIntersection && (
        <p className="text-sm text-destructive">{NO_PARCEL_INTERSECTION_MESSAGE}</p>
      )}

      {mutation.isError && (
        <p className="text-sm text-destructive">El análisis falló: {mutation.error.message}</p>
      )}
    </section>
  );
}
