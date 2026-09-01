import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';

import { MapView } from '@/components/map';
import { AnalyzeButton } from '@/components/sidebar/analyze-button';
import { AreaActions } from '@/components/sidebar/area-actions';
import { NavBar } from '@/components/sidebar/nav-bar';
import { backToSelectionAtom } from '@/store/mode';
import { uploadResultAtom } from '@/store/upload';

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
        </ClientOnly>
      </div>
    </main>
  );
}

/** Returning to `/` resumes selection: the surviving areas are editable again. */
function ResumeSelectionMode() {
  const backToSelection = useSetAtom(backToSelectionAtom);

  useEffect(() => backToSelection(), [backToSelection]);

  return null;
}

/** The drawing how-to yields its spot to the error toast while one is showing. */
function DrawInstructions() {
  const uploadResult = useAtomValue(uploadResultAtom);

  if (uploadResult?.error != null) return null;

  return <DrawInstructionsText />;
}

function DrawInstructionsText() {
  return (
    <p className="text-sm text-muted-foreground">
      Haga clic para comenzar el polígono, luego haga clic para añadir cada vértice.
      <br />
      Termine haciendo clic en el punto de inicio, haciendo doble clic o pulsando Enter.
    </p>
  );
}

/** The parcel-selection panel (Figma node 5145:4020). */
function Panel() {
  return (
    <aside className="flex h-full w-1/2 flex-col overflow-y-auto bg-background">
      <NavBar />

      <header className="flex flex-col gap-1.5 px-10 pt-10 pb-6">
        <h1 className="text-4xl font-semibold tracking-[-0.015em]">Selección de parcela</h1>
        <div className="text-sm text-muted-foreground">
          <p>Seleccione las parcelas que desee y pulse en Analizar.</p>
          <p>
            Puede seleccionar y deseleccionar áreas directamente en el mapa, dibujar un polígono
            para seleccionar las áreas que toque o subir un archivo.
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-6 px-10">
        <ClientOnly>
          <AreaActions />
        </ClientOnly>

        <ClientOnly fallback={<DrawInstructionsText />}>
          <DrawInstructions />
        </ClientOnly>
      </div>

      <div className="mt-auto px-10 pt-6 pb-10">
        <ClientOnly>
          <AnalyzeButton />
        </ClientOnly>
      </div>
    </aside>
  );
}
