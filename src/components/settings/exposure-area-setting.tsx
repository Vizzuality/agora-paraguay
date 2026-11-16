import { ClientOnly } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { Bug, ThermometerSun, type LucideIcon } from 'lucide-react';

import { CapasBasemap } from '@/components/map/capas-basemap';
import { ExposureLayers, type ExposureMapView } from '@/components/map/exposure-layers';
import { PanelMap } from '@/components/map/panel-map';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { selectedDistrictAtom } from '@/store/exposure';

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
 * Exposición climática's área de interés: two views, then one map under both, edge to
 * edge to the card's corners. The views choose what the map paints, the exposure base or
 * the reference layers; a district is picked on the map. The sidebar holds the open view.
 */
export function ExposureAreaSetting({
  view,
  onViewChange,
}: Readonly<{ view: ExposureMapView; onViewChange: (view: ExposureMapView) => void }>) {
  return (
    <div className="flex flex-col gap-4">
      <Tabs value={view} onValueChange={(value) => onViewChange(value as ExposureMapView)}>
        <TabsList aria-label="Vista del mapa" className="h-auto w-full gap-1.5 bg-transparent p-0">
          {VIEWS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className={VIEW_CLASS}>
              <Icon aria-hidden strokeWidth={1.5} />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Edge to edge under the views, as the design bleeds it to the card's corners. */}
      <div className="relative -mx-6 -mb-6 h-100 overflow-hidden rounded-3xl bg-muted">
        <ClientOnly>
          <PanelMap>
            <CapasBasemap showOverlay={view === 'capas'} />
            <ExposureLayers view={view} />
          </PanelMap>
        </ClientOnly>
      </div>
    </div>
  );
}
