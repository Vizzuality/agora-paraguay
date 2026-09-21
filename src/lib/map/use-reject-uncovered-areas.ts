import { useQuery } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';

import { parcelQueries } from '@/lib/api/parcels/queries';
import { drawPolygonsAtom } from '@/store/draw';
import { rejectAreasAtom } from '@/store/selection';

/**
 * When `filter-parcels` answers with no parcel at all for the areas (`status: "empty"`,
 * outside the cadastre's coverage), the areas are rejected: cleared from the map, the
 * panel back to step 1 with the backend's reason. An answer with parcels but none
 * selected is not this case — the user can still click one.
 *
 * `isSuccess` excludes the placeholder shown for a re-keyed query. Mounted from
 * `DrawLayer`, next to the other Terra Draw side effects.
 */
export function useRejectUncoveredAreas() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const reject = useSetAtom(rejectAreasAtom);
  const { data, isSuccess } = useQuery(parcelQueries.filtered(polygons));

  const uncovered = isSuccess && data.results.length === 0;
  const message = data?.message ?? '';

  useEffect(() => {
    if (uncovered) reject(message);
  }, [uncovered, message, reject]);
}
