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
import { useNarrowScreen } from '@/lib/use-narrow-screen';
import { analysedParcelIdsAtom } from '@/store/analysis';

/** The hero's closing buttons: a 48px pill, icon beside the label, sharing the row. */
const ACTION_CLASS = 'h-12 flex-1 rounded-2xl border px-8 font-normal';
/** A phone's buttons, on a row of their own under the hero card. */
const PHONE_ACTION_CLASS = 'h-11 flex-1 rounded-2xl px-4 font-normal';

/**
 * The analysis pages' side column: the hero with one tab per parcel Analizar submitted,
 * its filters, and Personalizar indicadores closing it. Tabs come from that snapshot, not
 * the analysis answer, so they show before the POST resolves. Exportar informe is
 * productivo's alone: the public side has no report. Reads an atom, so callers render it
 * inside `<ClientOnly>`. The page title is for screen readers only (the active nav tab
 * already names the riesgo) until the report prints it.
 *
 * Exportar informe prints the page: the print stylesheet (`print:` classes here and in
 * the hero, shell, nav and footer) turns it into the report — no chrome, one column, the
 * filters as plain information — and the browser saves the PDF under `reportFileName`.
 * In print the actions give way to a caption with the date.
 */
export function AnalysisSidebar({ riesgo }: Readonly<{ riesgo: Riesgo }>) {
  const parcelIds = useAtomValue(analysedParcelIdsAtom);
  const store = useStore();
  const title = RISK_TABS.find((tab) => tab.riesgo === riesgo)?.label;
  // A report printed mid-generation would go out without the summary: wait for it.
  const generatingSummary =
    useIsMutating({ mutationKey: analysisMutations.summary().mutationKey }) > 0;

  const narrow = useNarrowScreen();
  const actionClass = narrow ? PHONE_ACTION_CLASS : ACTION_CLASS;

  const actions = (
    <div className="flex items-center gap-4 print:hidden">
      <IndicatorPicker riesgo={riesgo} className={actionClass} />
      {riesgo === 'productivo' && (
        <Button
          className={actionClass}
          disabled={generatingSummary}
          title={generatingSummary ? 'Espere a que termine el resumen del análisis' : undefined}
          onClick={() => printReport(reportFileName(riesgo, new Date()), store)}
        >
          <Upload aria-hidden />
          Exportar informe
        </Button>
      )}
    </div>
  );

  // A phone keeps the actions out of the card, on a row under it.
  return (
    <>
      <AnalysisHero riesgo={riesgo} parcels={parcelIds} actions={!narrow && actions} />
      {narrow && actions}

      {/* On screen the row dissolves: the visually hidden title takes no room in the column. */}
      <div className="flex flex-wrap items-center justify-between gap-4 not-print:contents">
        <h1 className="text-[40px] font-thin tracking-[0.408px] not-print:sr-only">{title}</h1>
        <ReportCaption />
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
