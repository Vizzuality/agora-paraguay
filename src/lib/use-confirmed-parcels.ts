import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { parcelQueries } from '@/lib/api/parcels/queries';
import { applyToggles, selectedParcelIds } from '@/lib/map/parcel-selection';
import { drawPolygonsAtom } from '@/store/draw';
import { toggledParcelIdsAtom } from '@/store/parcels';

/**
 * What Analizar would send: the parcels `filter-parcels` selected for the areas, after the
 * user's flips. `noIntersection` is an answer with parcels around the areas but none
 * selected (the user can still click one); `isSuccess`, not the data, decides it, since a
 * re-keyed query shows the previous parcels as placeholder until the answer is in.
 */
export function useConfirmedParcels() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const toggled = useAtomValue(toggledParcelIdsAtom);
  const { data, isError, isSuccess } = useQuery(parcelQueries.filtered(polygons));
  const parcelIds = data ? selectedParcelIds(applyToggles(data.results, toggled)) : [];

  return { parcelIds, isError, noIntersection: isSuccess && parcelIds.length === 0 };
}
