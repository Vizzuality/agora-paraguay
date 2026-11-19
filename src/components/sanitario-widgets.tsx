import { AnalysisPanel } from '@/components/analysis-panel';
import { AnalysisStatus } from '@/components/analysis-status';
import { AnalysisWidgetCard } from '@/components/analysis-widget-card';
import { GeneralInfoCard } from '@/components/general-info-card';
import { WidgetGrid } from '@/components/widget-grid';
import { generalInfo } from '@/lib/analysis/indicator-cards';
import { useRiesgoWidgets } from '@/lib/analysis/use-riesgo-widgets';

/**
 * Riesgo sanitario's analysis: the open tab's text facts in Información de contexto (always on),
 * then the widgets (`useRiesgoWidgets`); under Todas the facts read the parcels combined.
 * Shared by `/analisis/sanitario` and the redesign. Reads atoms: render inside `<ClientOnly>`.
 */
export function SanitarioWidgets() {
  const { analysis, indicators, indicatorsError, parcel, widgets, describe } =
    useRiesgoWidgets('sanitario');

  const info = generalInfo(parcel, indicators, 'sanitario').map((row) => ({
    ...row,
    description: describe(row.description),
  }));

  return (
    // Fills the content column, so the first-run frame can take the height left.
    <div className="flex flex-1 flex-col gap-4">
      <AnalysisStatus analysis={analysis} indicatorsError={indicatorsError} />
      {/* Nothing to show before the first answer: no empty panel (and gap) under the frame. */}
      {analysis.data && (
        <AnalysisPanel busy={analysis.isPlaceholderData}>
          {info.length > 0 && <GeneralInfoCard items={info} />}
          <WidgetGrid>
            {widgets.map((widget) => (
              <AnalysisWidgetCard key={widget.id} widget={widget} />
            ))}
          </WidgetGrid>
        </AnalysisPanel>
      )}
    </div>
  );
}
