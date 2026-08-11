import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { placeholderQueries } from "@/lib/api/queries";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { data, isPending, isError, error } = useQuery(placeholderQueries.all());

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Ágora Paraguay</h1>
        <p className="text-sm text-gray-600">
          Phase 0 shell. The data below comes from the mock client in{" "}
          <code className="rounded bg-gray-100 px-1 py-0.5">src/lib/api/client.ts</code>.
        </p>
      </header>

      <section aria-live="polite">
        {isPending && <p className="text-sm text-gray-600">Loading…</p>}

        {isError && (
          <p className="text-sm text-red-700">Failed to load: {(error as Error).message}</p>
        )}

        {data && data.length === 0 && <p className="text-sm text-gray-600">No data.</p>}

        {data && data.length > 0 && (
          <ul className="flex flex-col gap-2">
            {data.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded border border-gray-200 px-3 py-2"
              >
                <span>{item.label}</span>
                <span className="font-mono text-sm">{item.value}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
