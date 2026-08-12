import { useQuery } from "@tanstack/react-query";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";

import { MapView } from "@/components/map";
import { placeholderQueries } from "@/lib/api/queries";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="relative h-screen w-full">
      {/* MapLibre touches window and document at import time, so it must never run
          during SSR. The fallback keeps the layout stable while it loads. */}
      <ClientOnly fallback={<div className="h-full w-full bg-gray-100" />}>
        <MapView />
      </ClientOnly>

      <Panel />
    </main>
  );
}

/** Placeholder panel exercising the mock data path end to end. */
function Panel() {
  const { data, isPending, isError, error } = useQuery(placeholderQueries.all());

  return (
    <aside className="absolute top-4 left-4 z-10 w-72 rounded-lg bg-white/95 p-4 shadow-lg backdrop-blur">
      <h1 className="text-lg font-semibold">Ágora Paraguay</h1>
      <p className="mt-1 text-xs text-gray-600">
        Placeholder basemap. The client's vector tiles are not wired in.
      </p>

      <section aria-live="polite" className="mt-3">
        {isPending && <p className="text-sm text-gray-600">Loading…</p>}

        {isError && (
          <p className="text-sm text-red-700">Failed to load: {(error as Error).message}</p>
        )}

        {data && data.length === 0 && <p className="text-sm text-gray-600">No data.</p>}

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
      </section>
    </aside>
  );
}
