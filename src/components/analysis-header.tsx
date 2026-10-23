import { useIsMutating } from '@tanstack/react-query';
import { useAtomValue, useStore } from 'jotai';
import { Upload } from 'lucide-react';
import { useState } from 'react';

import { AnalysisHero } from '@/components/analysis-hero';
import { IndicatorPicker } from '@/components/indicator-picker';
import { Button } from '@/components/ui/button';
import { printReport } from '@/lib/analysis/print-report';
import { reportCaption, reportFileName } from '@/lib/analysis/report';
import { analysisMutations } from '@/lib/api/analysis/queries';
import type { Riesgo } from '@/lib/api/metadata/schemas';
import { RISK_TABS } from '@/lib/nav-links';
import { analysedParcelIdsAtom } from '@/store/analysis';

/** The title row's buttons: a 44px pill, icon beside the label; on a mobile device each takes its share of the row. */
export const ACTION_CLASS = 'h-11 rounded-2xl px-8 font-normal max-md:flex-1 max-md:px-4';

/**
 * What both analysis pages put above their widgets: the hero with one tab per parcel
 * Analizar submitted, then the title row with Personalizar indicadores and Exportar.
 * Tabs come from that snapshot, not the analysis answer, so they show before the POST
 * resolves. Exportar informe is productivo's alone: the public side has no report.
 * Reads an atom, so callers render it inside `<ClientOnly>`. On a mobile device the
 * title is for screen readers only (the active tab already names the riesgo) and
 * the two actions share a row, icon over label.
 *
 * Exportar informe prints the page: the print stylesheet (`print:` classes here and in
 * the hero, nav and footer) turns it into the report — no chrome, the filters as plain
 * information — and the browser saves the PDF under `reportFileName`. In print the
 * actions give way to a caption with the date.
 */
export function AnalysisHeader({ riesgo }: Readonly<{ riesgo: Riesgo }>) {
  const parcelIds = useAtomValue(analysedParcelIdsAtom);
  const store = useStore();
  const title = RISK_TABS.find((tab) => tab.riesgo === riesgo)?.label;
  // A report printed mid-generation would go out without the summary: wait for it.
  const generatingSummary =
    useIsMutating({ mutationKey: analysisMutations.summary().mutationKey }) > 0;

  return (
    <>
      <AnalysisHero riesgo={riesgo} parcels={parcelIds} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Paper is narrower than `md`: the phone's hidden title would vanish from the report. */}
        <h1 className="text-[66px] font-thin tracking-[0.408px] max-md:not-print:sr-only print:text-[40px]">
          {title}
        </h1>

        <ReportCaption />

        <div className="flex items-center gap-4 max-md:w-full print:hidden">
          <IndicatorPicker riesgo={riesgo} className={ACTION_CLASS} />
          {riesgo === 'productivo' && (
            <Button
              className={ACTION_CLASS}
              disabled={generatingSummary}
              title={generatingSummary ? 'Espere a que termine el resumen del análisis' : undefined}
              onClick={() => printReport(reportFileName(riesgo, new Date()), store)}
            >
              <Upload aria-hidden />
              Exportar informe
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

/** Print only: when the report was generated. The page's mount is close enough to the click. */
function ReportCaption() {
  const [generatedAt] = useState(() => new Date());

  return (
    <p className="hidden text-sm text-muted-foreground print:block">{reportCaption(generatedAt)}</p>
  );
}
