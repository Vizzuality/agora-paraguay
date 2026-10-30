import { ClientOnly } from '@tanstack/react-router';
import { useState } from 'react';

import { InfoTip } from '@/components/info-tip';
import { ExposureLayers, type ExposureMapView } from '@/components/map/exposure-layers';
import { PanelMap } from '@/components/map/panel-map';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TRIGGER_CLASS =
  'h-auto flex-none rounded-none border-0 border-b-3 border-transparent px-0 py-2 font-normal text-accent-foreground after:hidden hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary dark:text-accent-foreground dark:data-[state=active]:border-primary dark:data-[state=active]:bg-transparent dark:data-[state=active]:text-primary';

/**
 * Exposición climática's map widget: the title, two views, and one map under both.
 * The tabs choose what the map paints: the exposure base or the reference layers.
 */
export function ExposureMapCard() {
  const [view, setView] = useState<ExposureMapView>('exposicion');

  return (
    <section
      aria-labelledby="mapa-exposicion"
      className="flex flex-col gap-2 rounded-3xl bg-card p-6 text-card-foreground backdrop-blur-xs"
    >
      <Tabs
        value={view}
        onValueChange={(value) => setView(value as ExposureMapView)}
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
            Capas
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative h-108 overflow-hidden rounded-md bg-muted">
        <ClientOnly>
          <PanelMap>
            <ExposureLayers view={view} />
          </PanelMap>
        </ClientOnly>
      </div>
    </section>
  );
}
