import { useQuery } from '@tanstack/react-query';
import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { MapView } from '@/components/map';
import { AnalyzeButton } from '@/components/map/analyze-button';
import { DrawControls } from '@/components/map/draw-controls';
import { PolygonList } from '@/components/map/polygon-list';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { placeholderQueries } from '@/lib/api/queries';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <main className="flex h-screen w-full">
      <Panel />

      {/* The map's positioning context: the draw controls anchor to it, not the page. */}
      <div className="relative h-full w-1/2">
        {/* MapLibre touches window and document at import time, so it must never run
            during SSR. The fallback keeps the layout stable while it loads. */}
        <ClientOnly fallback={<div className="h-full w-full bg-muted" />}>
          <MapView />
        </ClientOnly>

        {/* Outside the map — the drawn geometry is global state, not map-scoped — but
            still client-only: the controls are inert until Terra Draw has started, and
            keeping them off the server keeps the atom store out of a shared module-level
            store that every SSR request would see. */}
        <ClientOnly>
          <DrawControls />
        </ClientOnly>
      </div>
    </main>
  );
}

/** Placeholder panel exercising the mock data path end to end. */
function Panel() {
  const { data, isPending, isError, error, refetch } = useQuery(placeholderQueries.all());

  return (
    <aside className="flex h-full w-1/2 flex-col gap-4 overflow-y-auto bg-background p-6">
      <header>
        <h1 className="text-lg font-semibold">Ágora Paraguay</h1>
        <p className="text-xs text-muted-foreground">
          Mapa base provisional. Las teselas vectoriales del cliente no están conectadas.
        </p>
      </header>

      {/* Client-only for the same reason as the controls: it reads the draw atoms. */}
      <ClientOnly>
        <PolygonList />
        <AnalyzeButton />
      </ClientOnly>

      <section aria-live="polite" className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Capas provisionales
        </h2>

        {isPending && <p className="text-sm text-muted-foreground">Cargando…</p>}

        {isError && (
          <div className="flex flex-col items-start gap-2">
            <p className="text-sm text-destructive">Error al cargar: {(error as Error).message}</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Reintentar
            </Button>
          </div>
        )}

        {data && data.length === 0 && <p className="text-sm text-muted-foreground">Sin datos.</p>}

        {/* Two columns: the sidebar is half the viewport now, wide enough to pair the
            widget cards. */}
        <div className="grid gap-3 sm:grid-cols-2">
          {data?.map((item) => (
            <LayerCard
              key={item.id}
              title={item.title}
              value={item.value}
              description={item.description}
            />
          ))}
        </div>
      </section>
    </aside>
  );
}

function LayerCard({
  title,
  value,
  description,
}: Readonly<{
  title: string;
  value: number;
  description: string;
}>) {
  const [visible, setVisible] = useState(true);

  return (
    <StatCard
      label={title}
      // Locale is pinned rather than left to the runtime: this panel is server
      // rendered, and a server whose locale differs from the browser's would format
      // the number differently and break hydration.
      value={value.toLocaleString('es-PY')}
      caption={description}
      action={
        <Switch
          checked={visible}
          onCheckedChange={setVisible}
          aria-label={`Mostrar ${title} en el mapa`}
        />
      }
    />
  );
}
