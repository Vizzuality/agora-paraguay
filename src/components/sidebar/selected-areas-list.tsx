import { useAtomValue } from 'jotai';

import { polygonName } from '@/lib/map/draw-features';
import { drawPolygonsAtom } from '@/store/draw';
import { selectedParcelsAtom } from '@/store/parcels';

/**
 * The areas submitted for analysis — drawn, uploaded, and clicked cadastral parcels —
 * as a read-only list, in the same order `AnalyzeButton` submits them in. Nothing to
 * select: in analysis mode the selection is frozen.
 *
 * Rendered inside `<ClientOnly>`: it reads the draw atoms.
 */
export function SelectedAreasList() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const selectedParcels = useAtomValue(selectedParcelsAtom);

  const areas = [...polygons, ...selectedParcels];

  if (areas.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Áreas seleccionadas
      </h2>

      <ul className="flex flex-col gap-1">
        {areas.map((area, index) => (
          <li key={'id' in area ? area.id : area.properties.id} className="px-3 py-1.5 text-sm">
            {polygonName(area, index)}
          </li>
        ))}
      </ul>
    </section>
  );
}
