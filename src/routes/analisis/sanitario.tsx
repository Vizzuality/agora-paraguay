import { ClientOnly, createFileRoute } from '@tanstack/react-router';

import { AnalysisShell } from '@/components/analysis-shell';
import { AnalysisSidebar } from '@/components/analysis-sidebar';
import { SanitarioWidgets } from '@/components/sanitario-widgets';
import { WidgetGrid } from '@/components/widget-grid';

/** Riesgo sanitario is public: the hero beside the summary and the cards, no gate. */
export const Route = createFileRoute('/analisis/sanitario')({
  component: SanitarioPage,
});

function SanitarioPage() {
  return (
    <AnalysisShell
      side={
        <ClientOnly>
          <AnalysisSidebar riesgo="sanitario" />
        </ClientOnly>
      }
    >
      <ClientOnly fallback={<WidgetGrid />}>
        <SanitarioWidgets />
      </ClientOnly>
    </AnalysisShell>
  );
}
