import { ClientOnly } from '@tanstack/react-router';

import { InfoTip } from '@/components/info-tip';
import { CapasBasemap } from '@/components/map/capas-basemap';
import { ExposureLayers, type ExposureMapView } from '@/components/map/exposure-layers';
import { PanelMap } from '@/components/map/panel-map';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TRIGGER_CLASS =
  'h-auto flex-none rounded-none border-0 border-b-3 border-transparent px-0 py-2 font-normal text-accent-foreground after:hidden hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary dark:text-accent-foreground dark:data-[state=active]:border-primary dark:data-[state=active]:bg-transparent dark:data-[state=active]:text-primary';

/**
 * Exposición climática's map widget: the title, two views, and one map under both.
 * The tabs choose what the map paints, the exposure base or the reference layers, and
 * what the panel beside it shows; the page holds the open tab for both. The redesign
 * names the reference-layers tab Superficie expuesta.
 */
export function ExposureMapCard({
  view,
  onViewChange,
  layersLabel = 'Capas',
}: Readonly<{
  view: ExposureMapView;
  onViewChange: (view: ExposureMapView) => void;
  layersLabel?: string;
}>) {
  return (
    <section
      aria-labelledby="mapa-exposicion"
      className="flex flex-col gap-2 rounded-3xl bg-card p-6 text-card-foreground backdrop-blur-xs"
    >
      <Tabs
        value={view}
        onValueChange={(value) => onViewChange(value as ExposureMapView)}
        // The base `Tabs` stacks a horizontal list under its content; here they share a row.
        className="items-start justify-between gap-4 data-[orientation=horizontal]:flex-row"
      >
        <div className="flex items-center gap-2">
          <h2 id="mapa-exposicion" className="text-base tracking-[0.28px]">
            Mapa
          </h2>
          <InfoTip
            subject="Mapa"
            description="Exposición de los cultivos de soja a sequía e inundación en cada distrito."
          />
        </div>
        <TabsList variant="line" className="h-auto gap-5 rounded-2xl p-0">
          <TabsTrigger value="exposicion" className={TRIGGER_CLASS}>
            Nivel de exposición
          </TabsTrigger>
          <TabsTrigger value="capas" className={TRIGGER_CLASS}>
            {layersLabel}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative h-108 overflow-hidden rounded-md bg-muted">
        <ClientOnly>
          <PanelMap>
            <CapasBasemap showOverlay={view === 'capas'} />
            <ExposureLayers view={view} />
          </PanelMap>
        </ClientOnly>
      </div>
    </section>
  );
}
