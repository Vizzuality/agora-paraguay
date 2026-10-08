import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';

import { areasHectares, exceedsMaxArea, oversizedAreasMessage } from '@/lib/map/polygon-area';
import { drawPolygonsAtom } from '@/store/draw';
import { rejectAreasAtom } from '@/store/selection';

/**
 * Areas over `MAX_AREA_HECTARES` are rejected the way an out-of-coverage answer is
 * (`useRejectUncoveredAreas`): cleared from the map, the panel back to step 1 with the
 * reason. Only this never asks the API: `parcelQueries.filtered` stays disabled for
 * oversized areas, so the rejection is the only thing that happens to them. Mounted from
 * `DrawLayer`.
 */
export function useRejectOversizedAreas() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const reject = useSetAtom(rejectAreasAtom);
  const oversized = exceedsMaxArea(polygons);
  const hectares = areasHectares(polygons);

  useEffect(() => {
    if (oversized) reject(oversizedAreasMessage(hectares));
  }, [oversized, hectares, reject]);
}
