import { useMutation } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";
import { analysisMutations } from "@/lib/api/queries";
import { endAnalysisSessionAtom } from "@/store/analysis";
import { drawPolygonsAtom } from "@/store/draw";
import { selectedParcelsAtom } from "@/store/parcels";

/**
 * Submits every area on the map — drawn, uploaded, and the cadastral parcels selected
 * by clicking them — for analysis. The per-polygon selection in the list is a
 * highlight, not a filter: analysis sends everything.
 *
 * Renders inside `<ClientOnly>` (it reads the draw atoms).
 */
export function AnalyzeButton() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const selectedParcels = useAtomValue(selectedParcelsAtom);
  const endSession = useSetAtom(endAnalysisSessionAtom);
  const mutation = useMutation({
    ...analysisMutations.submit(),
    // Analyze ends the drawing session — tool parked, map clicks disarmed; the polygons
    // stay on the map until the user starts a new one. `useMutation`-level so an
    // unmount cannot skip it.
    onSuccess: () => endSession(),
  });

  const areas = [...polygons, ...selectedParcels];

  return (
    <section aria-live="polite" className="flex flex-col items-start gap-2">
      <Button
        size="sm"
        disabled={areas.length === 0 || mutation.isPending}
        onClick={() => mutation.mutate(areas)}
      >
        {mutation.isPending ? "Analizando…" : "Analizar"}
      </Button>

      {areas.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Dibuja, sube o selecciona áreas de interés para analizar.
        </p>
      )}

      {mutation.isSuccess && (
        <p className="text-sm text-muted-foreground">
          {acceptedStatus(mutation.data.receivedFeatures)}
        </p>
      )}

      {mutation.isError && (
        <p className="text-sm text-destructive">El análisis falló: {mutation.error.message}</p>
      )}
    </section>
  );
}

function acceptedStatus(count: number): string {
  return count === 1
    ? "Análisis aceptado: se envió 1 área."
    : `Análisis aceptado: se enviaron ${count} áreas.`;
}
