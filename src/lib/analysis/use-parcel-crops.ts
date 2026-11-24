import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { lastCrop } from '@/lib/analysis/last-crop';
import { parcelQueries } from '@/lib/api/parcels/queries';
import { activeParcelIdAtom, analysedParcelIdsAtom } from '@/store/analysis';
import { drawPolygonsAtom } from '@/store/draw';

/**
 * `lastCrop`: the crop the parcels in view last grew (the open tab's parcel, or under Todas
 * every analysed one), where the crop dropdown starts. Reads atoms, so callers render
 * inside `<ClientOnly>`.
 */
export function useParcelCrops() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const analysedIds = useAtomValue(analysedParcelIdsAtom);
  const activeId = useAtomValue(activeParcelIdAtom);
  const { data } = useQuery(parcelQueries.filtered(polygons));

  if (!data) return { lastCrop: undefined };

  const inView = activeId === null ? analysedIds : [activeId];

  return { lastCrop: lastCrop(data.results, inView) };
}
