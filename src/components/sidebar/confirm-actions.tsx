import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { CircleArrowRight, Undo2 } from 'lucide-react';

import { ActionCardButton } from '@/components/sidebar/action-card-button';
import { resolveAnalysisFilters } from '@/lib/analysis/filters';
import { analysisMutations } from '@/lib/api/analysis/queries';
import { metadataQueries } from '@/lib/api/metadata/queries';
import { analysisFiltersAtom, analysisResultAtom } from '@/store/analysis';
import { drawPolygonsAtom, restartSelectionAtom } from '@/store/draw';
import { startAnalysisAtom } from '@/store/mode';
import { selectedParcelsAtom } from '@/store/parcels';

/**
 * Step 2 of the selection (Figma 7172:1800): start over, or analyse every area on the
 * map — drawn, uploaded, and the cadastral parcels selected by clicking them. Analizar
 * runs the whole chain (`analyzeSelection`: indicators, parcel filtering, analysis) and
 * lands on riesgo sanitario, the public side, so the request goes to `public`.
 * Renders inside `<ClientOnly>` (it reads the draw atoms).
 */
export function ConfirmActions() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const selectedParcels = useAtomValue(selectedParcelsAtom);
  const selectedFilters = useAtomValue(analysisFiltersAtom);
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
      // TODO(mock-analysis): temporary, until /analisis renders the result.
      console.info('analysis response', result);
      setResult(result);
      startAnalysis();
      void navigate({ to: '/analisis' });
    },
  });

  const hasAreas = polygons.length > 0 || selectedParcels.length > 0;

  function analyze() {
    if (!options) return;

    mutation.mutate({
      visibility: 'public',
      polygons,
      parcels: selectedParcels,
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
          disabled={!hasAreas || !options || mutation.isPending}
          onClick={analyze}
        >
          {mutation.isPending ? 'Analizando…' : 'Analizar'}
        </ActionCardButton>
      </div>

      {mutation.isError && (
        <p className="text-sm text-destructive">El análisis falló: {mutation.error.message}</p>
      )}
    </section>
  );
}
