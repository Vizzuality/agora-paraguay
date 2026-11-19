import { ClientOnly, createFileRoute } from '@tanstack/react-router';

import { AnalysisActions } from '@/components/analysis-actions';
import { SanitarioWidgets } from '@/components/sanitario-widgets';
import { RiskPageContent } from '@/components/settings/risk-page-content';

/**
 * Riesgo sanitario in the redesign, public: the selection map, then Personalizar indicadores
 * beside Exportar informe, and the widgets.
 */
export const Route = createFileRoute('/analisis/sanitario')({
  component: SanitarioPage,
});

function SanitarioPage() {
  return (
    <ClientOnly fallback={<h1 className="sr-only">Riesgo sanitario</h1>}>
      <RiskPageContent
        title="Riesgo sanitario"
        analysis={
          <div className="flex flex-1 flex-col gap-4">
            <AnalysisActions riesgo="sanitario" />
            <SanitarioWidgets />
          </div>
        }
      />
    </ClientOnly>
  );
}
