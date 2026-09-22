import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { CircleArrowRight, Undo2 } from 'lucide-react';

import {
  NO_PARCEL_INTERSECTION_MESSAGE,
  PARCELS_REQUEST_FAILED_MESSAGE,
} from '@/components/error-toast';
import { ActionCardButton } from '@/components/sidebar/action-card-button';
import { parcelQueries } from '@/lib/api/parcels/queries';
import { applyToggles, selectedParcelIds } from '@/lib/map/parcel-selection';
import { drawPolygonsAtom, restartSelectionAtom } from '@/store/draw';
import { startAnalysisAtom } from '@/store/mode';
import { toggledParcelIdsAtom } from '@/store/parcels';

/**
 * Step 2 of the selection: start over, or analyse the parcels the drawn or uploaded
 * areas selected. `filter-parcels` already ran when the areas landed
 * (`parcelQueries.filtered`, painted on the map), and the user may have flipped some by
 * clicking them; Analizar sends the parcels selected after those flips to the analysis
 * page, which runs it (`useAnalysis`) and lands on riesgo sanitario, the public side.
 * Renders inside `<ClientOnly>` (it reads the draw atoms).
 */
export function ConfirmActions() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const toggled = useAtomValue(toggledParcelIdsAtom);
  const { data: parcels, isError, isSuccess } = useQuery(parcelQueries.filtered(polygons));
  const restart = useSetAtom(restartSelectionAtom);
  const startAnalysis = useSetAtom(startAnalysisAtom);
  const navigate = useNavigate();

  const parcelIds = parcels ? selectedParcelIds(applyToggles(parcels.results, toggled)) : [];

  // Parcels around the areas, none over the threshold: the user can still click one.
  // (No parcel at all is `useRejectUncoveredAreas`: the areas go, back to step 1.)
  // `isSuccess`, not `parcels`: a re-keyed query shows the previous parcels as
  // placeholder while the answer is not in yet.
  const noIntersection = isSuccess && parcelIds.length === 0;

  // Entering the mode before navigating keeps the store consistent even if navigation fails.
  function analyze() {
    startAnalysis(parcelIds);
    void navigate({ to: '/analisis' });
  }
  return (
    <section aria-live="polite" className="flex w-full flex-col gap-2">
      <div className="grid grid-cols-2 gap-1.5">
        <ActionCardButton icon={Undo2} onClick={() => restart()}>
          Reiniciar
        </ActionCardButton>

        <ActionCardButton
          variant="default"
          icon={CircleArrowRight}
          disabled={parcelIds.length === 0}
          onClick={analyze}
        >
          Analizar
        </ActionCardButton>
      </div>

      {isError && <p className="text-sm text-destructive">{PARCELS_REQUEST_FAILED_MESSAGE}</p>}

      {noIntersection && (
        <p className="text-sm text-destructive">{NO_PARCEL_INTERSECTION_MESSAGE}</p>
      )}
    </section>
  );
}
