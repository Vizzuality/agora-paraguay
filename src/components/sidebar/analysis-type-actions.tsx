import { useNavigate } from '@tanstack/react-router';
import { useSetAtom } from 'jotai';

import { ACTION_CARDS_ENTER, ActionCardButton } from '@/components/sidebar/action-card-button';
import { EXPOSURE_TAB, RISK_TABS } from '@/lib/nav-links';
import { cn } from '@/lib/utils';
import { analysisTypeAtom } from '@/store/selection';

/**
 * Step 1 of the selection: the analysis type. Exposición climática works by district,
 * so it opens its page directly; a riesgo moves on to the área de interés.
 */
export function AnalysisTypeActions() {
  const setAnalysisType = useSetAtom(analysisTypeAtom);
  const navigate = useNavigate();

  return (
    <fieldset className={cn('grid grid-cols-3 gap-1.5 max-md:grid-cols-1', ACTION_CARDS_ENTER)}>
      <legend className="sr-only">Tipo de análisis</legend>

      <ActionCardButton
        icon={EXPOSURE_TAB.icon}
        onClick={() => void navigate({ to: EXPOSURE_TAB.to })}
      >
        {EXPOSURE_TAB.label}
      </ActionCardButton>

      {RISK_TABS.map(({ label, riesgo, icon }) => (
        <ActionCardButton key={riesgo} icon={icon} onClick={() => setAnalysisType(riesgo)}>
          {label}
        </ActionCardButton>
      ))}
    </fieldset>
  );
}
