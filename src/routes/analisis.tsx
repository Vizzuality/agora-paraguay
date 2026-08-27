import { ClientOnly, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';

import { NavBar } from '@/components/sidebar/nav-bar';
import { SelectedAreasList } from '@/components/sidebar/selected-areas-list';
import { drawPolygonsAtom } from '@/store/draw';
import { selectedParcelsAtom } from '@/store/parcels';

export const Route = createFileRoute('/analisis')({
  component: AnalysisPage,
});

/** Placeholder for the analysis results page — content arrives with the real API. */
function AnalysisPage() {
  return (
    <main className="flex h-screen w-full flex-col">
      {/* Client-only like every other atom consumer (see draw-core.ts); a router
          `beforeLoad` guard is not an option — it runs on the server, where the
          shared module store must stay untouched. */}
      <ClientOnly>
        <EmptySelectionRedirect />
      </ClientOnly>

      <NavBar />

      <div className="flex flex-1 flex-col gap-6 px-10 pt-10">
        <h1 className="text-4xl font-semibold tracking-[-0.015em]">Análisis</h1>

        <ClientOnly>
          <SelectedAreasList />
        </ClientOnly>
      </div>
    </main>
  );
}

/**
 * A hard reload or a direct visit starts a fresh module store: selection mode, zero
 * areas — a blank analysis page. Send the user back to build a selection instead.
 */
function EmptySelectionRedirect() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const selectedParcels = useAtomValue(selectedParcelsAtom);
  const navigate = useNavigate();
  const empty = polygons.length === 0 && selectedParcels.length === 0;

  useEffect(() => {
    if (empty) void navigate({ to: '/', replace: true });
  }, [empty, navigate]);

  return null;
}
