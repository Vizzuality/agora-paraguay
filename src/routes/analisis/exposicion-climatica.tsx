import { ClientOnly, createFileRoute, Link } from '@tanstack/react-router';
import { useSetAtom } from 'jotai';

import { AnalysisShell } from '@/components/analysis-shell';
import { AnalysisWidgetCard } from '@/components/analysis-widget-card';
import { ExposureMapCard } from '@/components/exposure-map-card';
import { GeneralInfoList } from '@/components/general-info-card';
import { Button } from '@/components/ui/button';
import { WidgetGrid } from '@/components/widget-grid';
import { useExposureWidgets } from '@/lib/analysis/use-exposure-widgets';
import { RISK_TABS } from '@/lib/nav-links';
import { selectedDistrictAtom } from '@/store/exposure';

/**
 * Exposición climática: the country map beside the district panel, then the way to the
 * risk analyses. A district picked on the map heads the panel with its exposure indicators.
 */
export const Route = createFileRoute('/analisis/exposicion-climatica')({
  component: ExposicionClimaticaPage,
});

function ExposicionClimaticaPage() {
  return (
    <div className="flex flex-col gap-12">
      <h1 className="sr-only">Exposición climática</h1>

      <AnalysisShell side={<ExposureMapCard />} stretch>
        <ClientOnly fallback={<DistrictPrompt />}>
          <DistrictPanel />
        </ClientOnly>
      </AnalysisShell>

      <OtherRiskAnalyses />
    </div>
  );
}

/**
 * The district picked on the map with its exposure indicators, drawn as the riesgo pages
 * draw theirs (`useExposureWidgets`), or the prompt to pick one. The indicator list
 * loads with the page, so a pick shows its widgets at once.
 */
function DistrictPanel() {
  const setDistrict = useSetAtom(selectedDistrictAtom);
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
          <Button variant="secondary" className="rounded-2xl" onClick={() => setDistrict(null)}>
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

function DistrictPrompt() {
  return (
    <div className="flex min-h-108 flex-1 items-center justify-center rounded-3xl border-3 border-border p-6">
      <p className="max-w-md text-center text-sm text-muted-foreground">
        Seleccione un distrito en el mapa para ver sus indicadores sobre exposición a sequía e
        inundación.
      </p>
    </div>
  );
}

function OtherRiskAnalyses() {
  return (
    <section aria-labelledby="otros-analisis" className="flex flex-col gap-12">
      <h2 id="otros-analisis" className="text-6xl font-thin tracking-[0.408px]">
        Otros análisis de riesgo
      </h2>
      <div className="flex gap-1.5 max-md:flex-col">
        {RISK_TABS.map(({ label, riesgo, to, icon: Icon }) => {
          return (
            // Like the tabs: switching views must not stack history entries.
            <Link
              key={riesgo}
              to={to}
              replace
              className="flex flex-1 flex-col items-center justify-center gap-2.5 rounded-3xl border-3 border-secondary bg-secondary p-8 text-sm text-accent-foreground transition-colors hover:border-secondary-hover hover:bg-secondary-hover"
            >
              <Icon className="size-10 text-primary" strokeWidth={1.5} aria-hidden />
              {label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
