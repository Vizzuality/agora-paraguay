import { useSetAtom } from 'jotai';

import { AnalysisWidgetCard } from '@/components/analysis-widget-card';
import { GeneralInfoList } from '@/components/general-info-card';
import { Button } from '@/components/ui/button';
import { WidgetGrid } from '@/components/widget-grid';
import { useExposureWidgets } from '@/lib/analysis/use-exposure-widgets';
import { pickDistrictAtom } from '@/store/exposure';

/**
 * The district picked on the map with its exposure indicators, drawn as the riesgo pages
 * draw theirs (`useExposureWidgets`), or the prompt to pick one. The indicator list
 * loads with the page, so a pick shows its widgets at once. Shared by
 * `/analisis/exposicion-climatica` and the redesign. Reads atoms: render inside `<ClientOnly>`.
 */
export function DistrictPanel() {
  const pickDistrict = useSetAtom(pickDistrictAtom);
  const { indicators, district, info, widgets } = useExposureWidgets();

  if (!district) return <DistrictPrompt />;

  return (
    <section
      aria-labelledby="distrito-seleccionado"
      className="flex min-h-108 flex-1 flex-col gap-4"
    >
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

      {indicators.isPending && (
        <p className="text-sm text-muted-foreground">Cargando indicadores…</p>
      )}
      {indicators.isError && (
        <p className="text-sm text-destructive">No se pudieron cargar los indicadores.</p>
      )}
      <WidgetGrid>
        {widgets.map((widget) => (
          <AnalysisWidgetCard key={widget.id} widget={widget} />
        ))}
      </WidgetGrid>
    </section>
  );
}

/** The empty state until a district is picked; also the server-rendered fallback. */
export function DistrictPrompt() {
  return (
    <div className="flex min-h-108 flex-1 items-center justify-center rounded-3xl border-3 border-border p-6">
      <p className="max-w-md text-center text-sm text-muted-foreground">
        Seleccione un distrito en el mapa para ver sus indicadores sobre exposición a sequía e
        inundación.
      </p>
    </div>
  );
}
