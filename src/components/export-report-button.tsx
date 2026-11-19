import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useStore } from 'jotai';
import { Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { printReport } from '@/lib/analysis/print-report';
import { reportFileName } from '@/lib/analysis/report';
import { analysisMutations } from '@/lib/api/analysis/queries';
import type { Riesgo } from '@/lib/api/metadata/schemas';

/**
 * Exportar informe: prints the page as the report, once the indicators have loaded and
 * any summary in flight is done.
 */
export function ExportReportButton({
  riesgo,
  className,
}: Readonly<{ riesgo: Riesgo; className?: string }>) {
  const store = useStore();
  // A report printed mid-load would go out with stale or missing widgets: the indicator
  // list, or the analysis that fills them (`['analysis', …]`, re-run on every change).
  const loadingIndicators =
    useIsFetching({ queryKey: ['metadata', 'indicators'] }) +
      useIsFetching({ queryKey: ['analysis'] }) >
    0;
  // A report printed mid-generation would go out without the summary: wait for it.
  const generatingSummary =
    useIsMutating({ mutationKey: analysisMutations.summary().mutationKey }) > 0;
  const blocked = blockedReason(loadingIndicators, generatingSummary);

  return (
    <Button
      className={className}
      disabled={blocked !== undefined}
      title={blocked}
      onClick={() => printReport(reportFileName(riesgo, new Date()), store)}
    >
      <Upload aria-hidden />
      Exportar informe
    </Button>
  );
}

/** Why the report cannot go out yet, as the button's title; `undefined` when it can. */
function blockedReason(loadingIndicators: boolean, generatingSummary: boolean) {
  if (loadingIndicators) return 'Espere a que terminen de cargar los indicadores';
  if (generatingSummary) return 'Espere a que termine el resumen del análisis';
  return undefined;
}
