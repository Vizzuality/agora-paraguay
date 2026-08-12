import { useQuery } from "@tanstack/react-query";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";

import { MapView } from "@/components/map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="absolute top-4 left-4 z-10 w-80 gap-4 py-4">
      <CardHeader className="px-4">
        <CardTitle>Ágora Paraguay</CardTitle>
        <CardDescription>
          Placeholder basemap. The client's vector tiles are not wired in.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4" aria-live="polite">
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

        {data && data.length > 0 && (
          <ul className="flex flex-col gap-1">
            {data.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <span>{item.label}</span>
                <span className="font-mono text-xs">{item.value}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
