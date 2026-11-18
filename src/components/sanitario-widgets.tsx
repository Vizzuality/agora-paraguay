import { AnalysisPanel } from '@/components/analysis-panel';
import { AnalysisStatus } from '@/components/analysis-status';
import { AnalysisWidgetCard } from '@/components/analysis-widget-card';
import { GeneralInfoCard } from '@/components/general-info-card';
import { WidgetGrid } from '@/components/widget-grid';
import { generalInfo } from '@/lib/analysis/indicator-cards';
import { useRiesgoWidgets } from '@/lib/analysis/use-riesgo-widgets';

/**
 * Riesgo sanitario's analysis: the open tab's text facts in the summary card (always on),
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
    <div className="flex flex-col gap-4">
      <AnalysisStatus analysis={analysis} indicatorsError={indicatorsError} />
      <AnalysisPanel busy={analysis.isPlaceholderData}>
        {info.length > 0 && <GeneralInfoCard items={info} />}
        <WidgetGrid>
          {widgets.map((widget) => (
            <AnalysisWidgetCard key={widget.id} widget={widget} />
          ))}
        </WidgetGrid>
      </AnalysisPanel>
    </div>
  );
}
