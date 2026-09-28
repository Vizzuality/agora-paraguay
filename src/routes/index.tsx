import { useQuery } from '@tanstack/react-query';
import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';

import { MapView } from '@/components/map';
import { MapLoading } from '@/components/map/map-loading';
import { NavBar } from '@/components/sidebar/nav-bar';
import { SelectionBlock, SelectionBlockLayout } from '@/components/sidebar/selection-block';
import { parcelQueries } from '@/lib/api/parcels/queries';
import { drawPolygonsAtom } from '@/store/draw';
import { backToSelectionAtom } from '@/store/mode';

export const Route = createFileRoute('/')({
  component: SelectionPage,
});

function SelectionPage() {
  return (
    <main className="flex h-screen w-full">
      {/* Client-only like every other atom consumer (see draw-core.ts). */}
      <ClientOnly>
        <ResumeSelectionMode />
      </ClientOnly>

      <Panel />

      <div className="relative h-full w-1/2">
        {/* MapLibre touches window and document at import time, so it must never run
            during SSR. The fallback keeps the layout stable while it loads. */}
        <ClientOnly fallback={<div className="h-full w-full bg-muted" />}>
          <MapView />
          <ParcelsLookup />
        </ClientOnly>
      </div>
    </main>
  );
}

/** Veils the map while `filter-parcels` looks up the parcels for the areas just landed. */
function ParcelsLookup() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const { isFetching } = useQuery(parcelQueries.filtered(polygons));

  return isFetching ? <MapLoading>Buscando parcelas…</MapLoading> : null;
}

/** Returning to `/` resumes selection: the surviving areas are editable again. */
function ResumeSelectionMode() {
  const backToSelection = useSetAtom(backToSelectionAtom);

  useEffect(() => backToSelection(), [backToSelection]);

  return null;
}

/** The parcel-selection panel (Figma 7172:1758). */
function Panel() {
  return (
    <aside className="flex h-full w-1/2 flex-col overflow-y-auto bg-background">
      <NavBar />

      <ClientOnly fallback={<SelectionBlockLayout step={1} />}>
        <SelectionBlock />
      </ClientOnly>
    </aside>
  );
}
