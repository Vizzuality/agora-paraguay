import { useMutation } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";
import { analysisMutations } from "@/lib/api/queries";
import { drawPolygonsAtom, setDrawToolAtom } from "@/store/draw";

/**
 * Submits every polygon on the map — drawn and uploaded — for analysis. The per-polygon
 * selection in the list is a highlight, not a filter: analysis is all-or-nothing.
 *
 * Renders inside `<ClientOnly>` (it reads the draw atoms).
 */
export function AnalyzeButton() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const setTool = useSetAtom(setDrawToolAtom);
  const mutation = useMutation({
    ...analysisMutations.submit(),
    // Analyze ends the drawing session; the polygons stay on the map until the user
    // starts a new one. `useMutation`-level so an unmount cannot skip it.
    onSuccess: () => setTool(null),
  });

  return (
    <section aria-live="polite" className="flex flex-col items-start gap-2">
      <Button
        size="sm"
        disabled={polygons.length === 0 || mutation.isPending}
        onClick={() => mutation.mutate(polygons)}
      >
        {mutation.isPending ? "Analizando…" : "Analizar"}
      </Button>

      {polygons.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Dibuja o sube áreas de interés para analizar.
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
