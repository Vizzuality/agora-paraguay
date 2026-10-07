import { useAtomValue } from 'jotai';
import { Upload } from 'lucide-react';

import { AnalysisHero } from '@/components/analysis-hero';
import { IndicatorPicker } from '@/components/indicator-picker';
import { Button } from '@/components/ui/button';
import type { Riesgo } from '@/lib/api/metadata/schemas';
import { RISK_TABS } from '@/lib/nav-links';
import { analysedParcelIdsAtom } from '@/store/analysis';

/** The title row's buttons: a 44px pill, or on a mobile device half the row with the icon over the label. */
export const ACTION_CLASS =
  'h-11 rounded-2xl px-8 font-normal max-md:h-auto max-md:flex-1 max-md:flex-col max-md:gap-2.5 max-md:py-4';

/**
 * What both analysis pages put above their widgets: the hero with one tab per parcel
 * Analizar submitted, then the title row with Personalizar indicadores and Exportar.
 * Tabs come from that snapshot, not the analysis answer, so they show before the POST
 * resolves. Reads an atom, so callers render it inside `<ClientOnly>`. On a mobile
 * device the title is for screen readers only (the active tab already names the
 * riesgo) and the two actions share a row, icon over label.
 */
export function AnalysisHeader({ riesgo }: Readonly<{ riesgo: Riesgo }>) {
  const parcelIds = useAtomValue(analysedParcelIdsAtom);
  const title = RISK_TABS.find((tab) => tab.riesgo === riesgo)?.label;

  return (
    <>
      <AnalysisHero riesgo={riesgo} parcels={parcelIds} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[66px] font-thin tracking-[0.408px] max-md:sr-only">{title}</h1>

        <div className="flex items-center gap-4 max-md:w-full">
          <IndicatorPicker riesgo={riesgo} className={ACTION_CLASS} />
          <Button className={ACTION_CLASS}>
            <Upload aria-hidden />
            Exportar informe
          </Button>
        </div>
      </div>
    </>
  );
}
