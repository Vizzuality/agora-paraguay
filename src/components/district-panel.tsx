import { useSetAtom } from 'jotai';

import { AnalysisActions } from '@/components/analysis-actions';
import { AnalysisWidgetCard } from '@/components/analysis-widget-card';
import { GeneralInfoList } from '@/components/general-info-card';
import { Button } from '@/components/ui/button';
import { WidgetGrid } from '@/components/widget-grid';
import { useExposureWidgets } from '@/lib/analysis/use-exposure-widgets';
import { pickDistrictAtom } from '@/store/exposure';

/**
 * The district picked on the map with its exposure indicators, drawn as the riesgo pages
 * draw theirs (`useExposureWidgets`). The indicator list loads with the page, so a pick
 * shows its widgets at once. Reads atoms: render inside `<ClientOnly>`.
 */
export function DistrictPanel() {
  const pickDistrict = useSetAtom(pickDistrictAtom);
  const { indicators, district, info, widgets } = useExposureWidgets();

  if (!district) return null;

  return (
    <section
      aria-labelledby="distrito-seleccionado"
      className="flex min-h-108 flex-1 flex-col gap-4"
    >
      <AnalysisActions riesgo="exposicion_climatica" />

      <div className="flex flex-col gap-6 rounded-3xl bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="distrito-seleccionado" className="text-2xl font-semibold">
              {district.name}
            </h2>
            {district.department && (
              <p className="text-sm text-muted-foreground">{district.department}</p>
            )}
          </div>
          <Button variant="secondary" className="rounded-2xl" onClick={() => pickDistrict(null)}>
            Limpiar
          </Button>
        </div>
        {info.length > 0 && <GeneralInfoList items={info} />}
      </div>

      {/* Always mounted, so the load and its failure are announced as they change. */}
      <div aria-live="polite" className="empty:hidden">
        {indicators.isPending && (
          <p className="text-sm text-muted-foreground">Cargando indicadores…</p>
        )}
        {indicators.isError && (
          <p className="text-sm text-destructive">No se pudieron cargar los indicadores.</p>
        )}
      </div>
      <WidgetGrid>
        {widgets.map((widget) => (
          <AnalysisWidgetCard key={widget.id} widget={widget} />
        ))}
      </WidgetGrid>
    </section>
  );
}
