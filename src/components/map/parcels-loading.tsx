import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { Spinner } from '@/components/ui/spinner';
import { parcelQueries } from '@/lib/api/parcels/queries';
import { drawPolygonsAtom } from '@/store/draw';

/**
 * Veil over the selection map while `filter-parcels` looks up the parcels for the areas
 * just drawn or uploaded — the gap between an area landing and its parcels painting,
 * during which the map would otherwise look unchanged. Same query the layer and Analizar
 * read, so it lifts exactly when the parcels appear. Positioned by the map's container;
 * renders inside `<ClientOnly>` (reads the draw atoms).
 */
export function ParcelsLoading() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const { isFetching } = useQuery(parcelQueries.filtered(polygons));

  if (!isFetching) return null;

  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/40 backdrop-blur-xs">
      <output className="flex items-center gap-2 rounded-md bg-black/80 px-4 py-2 text-sm text-white">
        <Spinner className="size-5" />
        Buscando parcelas…
      </output>
    </div>
  );
}
