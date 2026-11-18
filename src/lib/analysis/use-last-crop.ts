import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { lastCrop } from '@/lib/analysis/last-crop';
import { parcelQueries } from '@/lib/api/parcels/queries';
import { activeParcelIdAtom, analysedParcelIdsAtom } from '@/store/analysis';
import { drawPolygonsAtom } from '@/store/draw';

/**
 * The crop the parcels in view last grew (`lastCrop`): the open tab's parcel, or under
 * Todas every analysed one. Reads atoms, so callers render inside `<ClientOnly>`.
 */
export function useLastCrop() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const analysedIds = useAtomValue(analysedParcelIdsAtom);
  const activeId = useAtomValue(activeParcelIdAtom);
  const { data } = useQuery(parcelQueries.filtered(polygons));

  if (!data) return undefined;

  const parcelIds = activeId === null ? analysedIds : [activeId];

  return lastCrop(data.results, parcelIds);
}
