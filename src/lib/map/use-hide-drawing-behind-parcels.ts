import { useQuery } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';

import { parcelQueries } from '@/lib/api/parcels/queries';
import { drawAtom, drawPolygonsAtom, setPolygonsHiddenAtom } from '@/store/draw';

/**
 * Once `filter-parcels` has answered for the drawn or uploaded areas, the parcels stand in
 * for the drawing: its polygons are painted transparent (`hidden`, read by
 * `draw-styles.ts`) while their geometry keeps driving the query and stays editable.
 * Shown again when the parcels go (Reiniciar, an answer with nothing in it).
 *
 * An effect, not a render condition: the drawing is Terra Draw's, painted from its own
 * feature store, so hiding it is a property write on those features. `bound` is a
 * dependency because Terra Draw is rebuilt after a visit to /analisis and restores the
 * polygons from the store without the flag.
 *
 * Runs inside `<Map>`, mounted from `DrawLayer` next to the other Terra Draw side effects.
 */
export function useHideDrawingBehindParcels() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const { bound } = useAtomValue(drawAtom);
  const setPolygonsHidden = useSetAtom(setPolygonsHiddenAtom);
  const { data } = useQuery(parcelQueries.filtered(polygons));

  const hasParcels = (data?.results.length ?? 0) > 0;

  useEffect(() => {
    if (bound) setPolygonsHidden(hasParcels);
  }, [bound, hasParcels, setPolygonsHidden]);
}
