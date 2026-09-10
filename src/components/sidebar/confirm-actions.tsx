import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { CircleArrowRight, Undo2 } from 'lucide-react';

import { ActionCardButton } from '@/components/sidebar/action-card-button';
import { analysisMutations } from '@/lib/api/queries';
import { drawPolygonsAtom, restartSelectionAtom } from '@/store/draw';
import { startAnalysisAtom } from '@/store/mode';
import { selectedParcelsAtom } from '@/store/parcels';

/**
 * Step 2 of the selection (Figma 7172:1800): start over, or submit every area on the
 * map — drawn, uploaded, and the cadastral parcels selected by clicking them — for
 * analysis. Renders inside `<ClientOnly>` (it reads the draw atoms).
 */
export function ConfirmActions() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const selectedParcels = useAtomValue(selectedParcelsAtom);
  const restart = useSetAtom(restartSelectionAtom);
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
    <section aria-live="polite" className="flex w-full flex-col gap-2">
      <div className="grid grid-cols-2 gap-1.5">
        <ActionCardButton icon={Undo2} onClick={() => restart()} disabled={mutation.isPending}>
          Reiniciar
        </ActionCardButton>

        <ActionCardButton
          variant="default"
          icon={CircleArrowRight}
          disabled={areas.length === 0 || mutation.isPending}
          onClick={() => mutation.mutate(areas)}
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
