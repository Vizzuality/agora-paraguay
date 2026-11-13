import { AnalysisPanel } from '@/components/analysis-panel';
import { AnalysisStatus } from '@/components/analysis-status';
import { AnalysisWidgetCard } from '@/components/analysis-widget-card';
import { WidgetGrid } from '@/components/widget-grid';
import { useRiesgoWidgets } from '@/lib/analysis/use-riesgo-widgets';

/**
 * Riesgo productivo's widgets (`useRiesgoWidgets`), restricted to what applies to the
 * crop (`useApplicableIndicators`): under Todas a number bins every parcel's value and a
 * category counts them per class; on a parcel tab the number is that parcel's figure on
 * the same scale and the category reads its class on the ruler. Shared by
 * `/analisis/productivo` and the redesign. Reads atoms: render inside `<ClientOnly>`.
 */
export function ProductivoWidgets() {
  const { analysis, indicatorsError, widgets } = useRiesgoWidgets('productivo');

  return (
    <div className="flex flex-col gap-4">
      <AnalysisStatus analysis={analysis} indicatorsError={indicatorsError} />
      <AnalysisPanel busy={analysis.isPlaceholderData}>
        <WidgetGrid>
          {widgets.map((widget) => (
            <AnalysisWidgetCard key={widget.id} widget={widget} />
          ))}
        </WidgetGrid>
      </AnalysisPanel>
    </div>
  );
}
