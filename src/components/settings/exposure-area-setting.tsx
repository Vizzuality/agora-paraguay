import { ClientOnly } from '@tanstack/react-router';
import { useAtom, useAtomValue } from 'jotai';
import { Bug, ThermometerSun, type LucideIcon } from 'lucide-react';

import { CapasBasemap } from '@/components/map/capas-basemap';
import { ExposureLayers, type ExposureMapView } from '@/components/map/exposure-layers';
import { PanelMap } from '@/components/map/panel-map';
import { ReportMapImage, ReportSnapshot } from '@/components/map/report-snapshot';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { exposureMapViewAtom, selectedDistrictAtom } from '@/store/exposure';

const VIEWS: { value: ExposureMapView; label: string; icon: LucideIcon }[] = [
  { value: 'exposicion', label: 'Nivel de exposición', icon: ThermometerSun },
  { value: 'capas', label: 'Superficie expuesta', icon: Bug },
];

/** A view button: icon left of its label on the secondary fill, the open one outlined in primary. */
const VIEW_CLASS =
  'h-12 flex-1 gap-2.5 rounded-2xl border border-border bg-secondary px-8 text-sm font-normal text-primary shadow-none after:hidden hover:bg-secondary-hover data-[state=active]:border-3 data-[state=active]:border-primary data-[state=active]:bg-secondary data-[state=active]:text-primary data-[state=active]:shadow-none dark:data-[state=active]:border-primary dark:data-[state=active]:bg-secondary dark:data-[state=active]:text-primary max-md:px-4 [&_svg:not([class*=size-])]:size-6';

/** The closed section's summary: the picked district, or what to do. */
export function useExposureAreaLabel(): string {
  return useAtomValue(selectedDistrictAtom)?.name ?? 'Seleccione un distrito';
}

/**
 * Exposición climática's área de interés once a district is picked: the settings
 * section's body, two views then one map under both, edge to edge to the card's corners.
 */
export function ExposureAreaSetting() {
  return (
    <div className="flex flex-col gap-4">
      <ExposureViewTabs />
      {/* Edge to edge under the views, as the design bleeds it to the card's corners. */}
      <ExposureMap className="-mx-6 -mb-6 h-100" />
    </div>
  );
}

/**
 * The same área before a pick, filling the content column: the map is the page until a
 * district is chosen on it.
 */
export function ExposureMapCard() {
  return (
    <section
      aria-label="Área de interés"
      className="flex min-h-108 flex-1 flex-col gap-4 rounded-3xl bg-card pt-4 backdrop-blur-xs"
    >
      <div className="px-6">
        <ExposureViewTabs />
      </div>
      <ExposureMap className="flex-1" />
    </section>
  );
}

/** The views choose what the map paints: the exposure base or the reference layers. */
function ExposureViewTabs() {
  const [view, setView] = useAtom(exposureMapViewAtom);

  return (
    <Tabs value={view} onValueChange={(value) => setView(value as ExposureMapView)}>
      <TabsList aria-label="Vista del mapa" className="h-auto w-full gap-1.5 bg-transparent p-0">
        {VIEWS.map(({ value, label, icon: Icon }) => (
          <TabsTrigger key={value} value={value} className={VIEW_CLASS}>
            <Icon aria-hidden strokeWidth={1.5} />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

/** The exposure map in the open view; a district is picked on it, and the report prints it. */
function ExposureMap({ className }: Readonly<{ className?: string }>) {
  const view = useAtomValue(exposureMapViewAtom);
  const district = useAtomValue(selectedDistrictAtom);

  return (
    <div className={cn('relative overflow-hidden rounded-3xl bg-muted', className)}>
      <ClientOnly>
        {/* Nivel de exposición colours whole districts, so it drops the dimming around them. */}
        <PanelMap mask={view !== 'exposicion'}>
          <CapasBasemap showOverlay={view === 'capas'} />
          <ExposureLayers view={view} />
          {/* Without bounds the camera stays where the pick flew it: on the district. */}
          {district && <ReportSnapshot frame={district.bounds ?? null} />}
          {district && <ReportMapImage />}
        </PanelMap>
      </ClientOnly>
    </div>
  );
}
