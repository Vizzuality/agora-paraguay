import { useQuery } from "@tanstack/react-query";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { MapView } from "@/components/map";
import { DrawControls } from "@/components/map/draw-controls";
import { PolygonList } from "@/components/map/polygon-list";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { placeholderQueries } from "@/lib/api/queries";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="relative h-screen w-full">
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

      <Panel />
    </main>
  );
}

/** Placeholder panel exercising the mock data path end to end. */
function Panel() {
  const { data, isPending, isError, error, refetch } = useQuery(placeholderQueries.all());

  return (
    <aside className="absolute top-4 left-4 z-10 flex max-h-[calc(100vh-2rem)] w-96 flex-col gap-4 overflow-y-auto rounded-xl bg-background/95 p-4 shadow-lg backdrop-blur">
      <header>
        <h1 className="text-lg font-semibold">Ágora Paraguay</h1>
        <p className="text-xs text-muted-foreground">
          Placeholder basemap. The client's vector tiles are not wired in.
        </p>
      </header>

      {/* Client-only for the same reason as the controls: it reads the draw atoms. */}
      <ClientOnly>
        <PolygonList />
      </ClientOnly>

      <section aria-live="polite" className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Placeholder layers
        </h2>

        {isPending && <p className="text-sm text-muted-foreground">Loading…</p>}

        {isError && (
          <div className="flex flex-col items-start gap-2">
            <p className="text-sm text-destructive">Failed to load: {(error as Error).message}</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        )}

        {data && data.length === 0 && <p className="text-sm text-muted-foreground">No data.</p>}

        {data?.map((item, index) => (
          <LayerCard
            key={item.id}
            label={item.label}
            value={item.value}
            hue={index % 2 === 0 ? "var(--chart-1)" : "var(--chart-2)"}
          />
        ))}
      </section>
    </aside>
  );
}

function LayerCard({ label, value, hue }: { label: string; value: number; hue: string }) {
  const [visible, setVisible] = useState(true);

  return (
    <StatCard
      label={label}
      value={`${value}%`}
      caption="of all parcels"
      meter={{ value, color: hue }}
      action={
        <Switch
          checked={visible}
          onCheckedChange={setVisible}
          aria-label={`Show ${label} on the map`}
        />
      }
    />
  );
}
