import { Spinner } from '@/components/ui/spinner';
import type { useAnalysis } from '@/lib/analysis/use-analysis';
import { errorReason } from '@/lib/api/http';

type AnalysisStatusProps = Pick<ReturnType<typeof useAnalysis>, 'analysis' | 'indicatorsError'>;

/**
 * What both analysis pages say above their widgets: the indicator list failing, the
 * analysis failing, and the first run in flight (a re-run shows over the results, in
 * `AnalysisPanel`). Nothing when all is well. Alerts for failures, a live region for the wait.
 */
export function AnalysisStatus({ analysis, indicatorsError }: Readonly<AnalysisStatusProps>) {
  return (
    <>
      {indicatorsError && (
        <p role="alert" className="text-sm text-destructive">
          No se pudieron cargar los indicadores: {errorReason(indicatorsError)}
        </p>
      )}
      {analysis.isError && (
        <p role="alert" className="text-sm text-destructive">
          El análisis falló: {errorReason(analysis.error)}
        </p>
      )}
      {analysis.isFetching && !analysis.data && (
        <output className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          Analizando…
        </output>
      )}
    </>
  );
}
