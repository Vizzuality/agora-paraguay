import type { useAnalysis } from '@/lib/analysis/use-analysis';
import { errorReason } from '@/lib/api/http';

type AnalysisStatusProps = Pick<ReturnType<typeof useAnalysis>, 'analysis' | 'indicatorsError'>;

/**
 * What both analysis pages say above their tiles: the indicator list failing, the
 * analysis failing, and the first run in flight. Nothing when all is well. Alerts for
 * failures, a polite live region for the wait.
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
        <p aria-live="polite" className="text-sm text-muted-foreground">
          Analizando…
        </p>
      )}
    </>
  );
}
