import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { lastCrop } from '@/lib/analysis/last-crop';
import { parcelCrops } from '@/lib/analysis/parcel-crops';
import { parcelQueries } from '@/lib/api/parcels/queries';
import { activeParcelIdAtom, analysedParcelIdsAtom } from '@/store/analysis';
import { drawPolygonsAtom } from '@/store/draw';

/**
 * What the analysed parcels grew: `lastCrop`, the crop the parcels in view last grew (the
 * open tab's parcel, or under Todas every analysed one), and `crops`, every crop any
 * analysed parcel has grown (`parcelCrops`). Reads atoms, so callers render inside
 * `<ClientOnly>`.
 */
export function useParcelCrops() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const analysedIds = useAtomValue(analysedParcelIdsAtom);
  const activeId = useAtomValue(activeParcelIdAtom);
  const { data } = useQuery(parcelQueries.filtered(polygons));

  if (!data) return { lastCrop: undefined, crops: [] };

  return {
    lastCrop: lastCrop(data.results, activeId === null ? analysedIds : [activeId]),
    crops: parcelCrops(data.results, analysedIds),
  };
}
