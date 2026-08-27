import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useAtomValue, useSetAtom } from 'jotai';

import { Button } from '@/components/ui/button';
import { analysisMutations } from '@/lib/api/queries';
import { drawPolygonsAtom } from '@/store/draw';
import { startAnalysisAtom } from '@/store/mode';
import { selectedParcelsAtom } from '@/store/parcels';

/**
 * Submits every area on the map — drawn, uploaded, and the cadastral parcels selected
 * by clicking them — for analysis. The per-polygon selection in the list is a
 * highlight, not a filter: analysis sends everything.
 *
 * Renders inside `<ClientOnly>` (it reads the draw atoms).
 */
export function AnalyzeButton() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const selectedParcels = useAtomValue(selectedParcelsAtom);
  const startAnalysis = useSetAtom(startAnalysisAtom);
  const navigate = useNavigate();
  const mutation = useMutation({
    ...analysisMutations.submit(),
    // Analyze enters analysis mode and moves to the results page. Entering the mode
    // before navigating keeps the store consistent even if navigation fails.
    // `useMutation`-level so an unmount cannot skip it.
    onSuccess: () => {
      startAnalysis();
      void navigate({ to: '/analisis' });
    },
  });

  const areas = [...polygons, ...selectedParcels];

  return (
    <section aria-live="polite" className="flex w-full flex-col items-start gap-2">
      <Button
        className="h-11 w-full rounded-2xl"
        disabled={areas.length === 0 || mutation.isPending}
        onClick={() => mutation.mutate(areas)}
      >
        {mutation.isPending ? 'Analizando…' : 'Analizar'}
      </Button>

      {mutation.isError && (
        <p className="text-sm text-destructive">El análisis falló: {mutation.error.message}</p>
      )}
    </section>
  );
}
