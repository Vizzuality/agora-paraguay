import { Spinner } from '@/components/ui/spinner';
import type { useAnalysis } from '@/lib/analysis/use-analysis';
import { errorReason } from '@/lib/api/http';

type AnalysisStatusProps = Pick<ReturnType<typeof useAnalysis>, 'analysis' | 'indicatorsError'>;

/**
 * What both analysis pages say above their widgets: the indicator list failing, the
 * analysis failing, and a run in flight: the first one, or a re-run while the previous
 * cards stay. Nothing when all is well. Alerts for failures, a live region for the wait.
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
      {analysis.isFetching && (
        <output className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          {analysis.data ? 'Actualizando análisis…' : 'Analizando…'}
        </output>
      )}
    </>
  );
}
