import { useAtomValue } from 'jotai';
import { Upload } from 'lucide-react';

import { AnalysisHero } from '@/components/analysis-hero';
import { IndicatorPicker } from '@/components/indicator-picker';
import { Button } from '@/components/ui/button';
import type { Riesgo } from '@/lib/api/metadata/schemas';
import { RISK_TABS } from '@/lib/nav-links';
import { analysedParcelIdsAtom } from '@/store/analysis';

/**
 * What both analysis pages put above their widgets: the hero with one tab per parcel
 * Analizar submitted, then the title row with Personalizar indicadores and Exportar.
 * Tabs come from that snapshot, not the analysis answer, so they show before the POST
 * resolves. Exportar informe is productivo's alone: the public side has no report. Reads an atom, so callers render it inside `<ClientOnly>`.
 */
export function AnalysisHeader({ riesgo }: Readonly<{ riesgo: Riesgo }>) {
  const parcelIds = useAtomValue(analysedParcelIdsAtom);
  const title = RISK_TABS.find((tab) => tab.riesgo === riesgo)?.label;

  return (
    <>
      <AnalysisHero riesgo={riesgo} parcels={parcelIds} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[66px] font-thin tracking-[0.408px]">{title}</h1>

        <div className="flex items-center gap-4">
          <IndicatorPicker riesgo={riesgo} />
          {riesgo === 'productivo' && (
            <Button className="h-11 rounded-2xl px-8 font-normal">
              <Upload aria-hidden />
              Exportar informe
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
