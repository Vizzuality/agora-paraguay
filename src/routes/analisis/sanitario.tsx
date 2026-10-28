import { ClientOnly, createFileRoute } from '@tanstack/react-router';

import { AnalysisShell } from '@/components/analysis-shell';
import { AnalysisSidebar } from '@/components/analysis-sidebar';
import { AnalysisStatus } from '@/components/analysis-status';
import { AnalysisWidgetCard } from '@/components/analysis-widget-card';
import { GeneralInfoCard } from '@/components/general-info-card';
import { WidgetGrid } from '@/components/widget-grid';
import { generalInfo } from '@/lib/analysis/indicator-cards';
import { useRiesgoWidgets } from '@/lib/analysis/use-riesgo-widgets';

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

/**
 * The open tab's text facts in the summary card (always on), then the widgets
 * (`useRiesgoWidgets`): under Todas the facts read the parcels combined.
 */
function SanitarioWidgets() {
  const { analysis, indicators, indicatorsError, parcel, widgets, describe } =
    useRiesgoWidgets('sanitario');

  const info = generalInfo(parcel, indicators, 'sanitario').map((row) => ({
    ...row,
    description: describe(row.description),
  }));

  return (
    <div className="flex flex-col gap-4">
      <AnalysisStatus analysis={analysis} indicatorsError={indicatorsError} />
      {info.length > 0 && <GeneralInfoCard items={info} />}
      <WidgetGrid>
        {widgets.map((widget) => (
          <AnalysisWidgetCard key={widget.id} widget={widget} />
        ))}
      </WidgetGrid>
    </div>
  );
}
