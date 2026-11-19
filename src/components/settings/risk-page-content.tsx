import { useAtomValue } from 'jotai';
import type { ReactNode } from 'react';

import { AnalysisTitle } from '@/components/analysis-title';
import { MapView } from '@/components/map';
import { ParcelsLookup } from '@/components/map/parcels-lookup';
import { ReportAttribution } from '@/components/report-attribution';
import { analysedViewAtom } from '@/store/mode';

/**
 * A riesgo's content column: the selection map until Analizar, then the analysis (its
 * own ticket per riesgo). Reads atoms: render inside `<ClientOnly>`.
 */
export function RiskPageContent({
  title,
  analysis,
}: Readonly<{ title: string; analysis?: ReactNode }>) {
  const analysed = useAtomValue(analysedViewAtom);

  return (
    <>
      <h1 className="sr-only">{title}</h1>
      {analysed && <AnalysisTitle title={title} />}
      {!analysed && (
        // The window's height less the column's padding, so the whole map is in view.
        <div className="relative h-[calc(100dvh-5rem)] min-h-96 overflow-hidden rounded-3xl bg-muted">
          <MapView />
          <ParcelsLookup />
        </div>
      )}
      {analysed && analysis}
      {/* The report's last line: who generated it, for which analysis, when. */}
      {analysed && <ReportAttribution />}
    </>
  );
}
