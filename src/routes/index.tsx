import { useQuery } from "@tanstack/react-query";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { MapView } from "@/components/map";
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

        {data?.map((item) => (
          <LayerCard
            key={item.id}
            title={item.title}
            value={item.value}
            description={item.description}
          />
        ))}
      </section>
    </aside>
  );
}

function LayerCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  const [visible, setVisible] = useState(true);

  return (
    <StatCard
      label={title}
      // Locale is pinned rather than left to the runtime: this panel is server
      // rendered, and a server whose locale differs from the browser's would format
      // the number differently and break hydration.
      value={value.toLocaleString("es-PY")}
      caption={description}
      action={
        <Switch
          checked={visible}
          onCheckedChange={setVisible}
          aria-label={`Show ${title} on the map`}
        />
      }
    />
  );
}
