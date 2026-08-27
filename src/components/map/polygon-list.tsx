import { useAtomValue, useSetAtom } from 'jotai';

import { Button } from '@/components/ui/button';
import { polygonName } from '@/lib/map/draw-features';
import { selectAnalysisPolygonAtom } from '@/store/analysis';
import { drawAtom } from '@/store/draw';

/**
 * One entry per polygon on the map — drawn and uploaded alike — each selectable as
 * the area the (future) analysis will run on. The selection model is uniform on
 * purpose: whatever consumes `analysisPolygonAtom` never has to care where the
 * polygon came from.
 *
 * Rendered in the panel, inside `<ClientOnly>`: it reads the draw atoms.
 */
export function PolygonList() {
  const draw = useAtomValue(drawAtom);
  const selectAnalysisPolygon = useSetAtom(selectAnalysisPolygonAtom);

  if (draw.polygons.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Áreas de interés
      </h2>

      <ul className="flex flex-col gap-1">
        {draw.polygons.map((polygon, index) => {
          const selected = polygon.id === draw.analysisId;

          return (
            <li key={polygon.id}>
              <Button
                variant={selected ? 'secondary' : 'ghost'}
                size="sm"
                className="w-full justify-start"
                aria-pressed={selected}
                onClick={() => selectAnalysisPolygon(polygon.id)}
              >
                {polygonName(polygon, index)}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
