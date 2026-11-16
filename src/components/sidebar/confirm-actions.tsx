import { useNavigate } from '@tanstack/react-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { CircleArrowRight, Undo2 } from 'lucide-react';

import {
  NO_PARCEL_INTERSECTION_MESSAGE,
  PARCELS_REQUEST_FAILED_MESSAGE,
} from '@/components/error-toast';
import { ACTION_CARDS_ENTER, ActionCardButton } from '@/components/sidebar/action-card-button';
import { RISK_TABS } from '@/lib/nav-links';
import { useConfirmedParcels } from '@/lib/use-confirmed-parcels';
import { cn } from '@/lib/utils';
import { restartAnalysisAtom } from '@/store/draw';
import { startAnalysisAtom } from '@/store/mode';
import { analysisTypeAtom } from '@/store/selection';

/**
 * Step 3 of the selection: start over, or analyse the parcels the drawn or uploaded
 * areas selected. `filter-parcels` already ran when the areas landed
 * (`parcelQueries.filtered`, painted on the map), and the user may have flipped some by
 * clicking them; Analizar sends the parcels selected after those flips to the analysis
 * page, which runs it (`useAnalysis`) and lands on the riesgo picked on step 1 — sanitario,
 * the public side, when a reload restored the areas without it.
 * Renders inside `<ClientOnly>` (it reads the draw atoms). `layout` is the buttons':
 * the panel's cards, or the phone's bar under the map.
 */
export function ConfirmActions({ layout = 'card' }: Readonly<{ layout?: 'card' | 'bar' }>) {
  const { parcelIds, isError, noIntersection } = useConfirmedParcels();
  const analysisType = useAtomValue(analysisTypeAtom);
  const restart = useSetAtom(restartAnalysisAtom);
  const startAnalysis = useSetAtom(startAnalysisAtom);
  const navigate = useNavigate();

  // Entering the mode before navigating keeps the store consistent even if navigation fails.
  function analyze() {
    startAnalysis(parcelIds);
    const tab = RISK_TABS.find(({ riesgo }) => riesgo === (analysisType ?? 'sanitario'));
    void navigate({ to: tab?.to ?? '/analisis/sanitario' });
  }
  return (
    <section aria-live="polite" className="flex w-full flex-col gap-2">
      <div
        className={
          layout === 'card' ? cn('grid grid-cols-2 gap-1.5', ACTION_CARDS_ENTER) : 'flex gap-2'
        }
      >
        <ActionCardButton icon={Undo2} layout={layout} onClick={() => restart()}>
          Reiniciar
        </ActionCardButton>

        <ActionCardButton
          variant="default"
          icon={CircleArrowRight}
          layout={layout}
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
