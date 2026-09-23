import { useQuery } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import { useMemo } from 'react';

import { parcelQueries } from '@/lib/api/parcels/queries';
import { useParcelHitClick } from '@/lib/map/use-parcel-click';
import { analysedParcelIdsAtom, selectAnalysedParcelAtom } from '@/store/analysis';
import { drawPolygonsAtom } from '@/store/draw';

/**
 * The hero mini map's click: a parcel Analizar submitted opens its tab in the hero
 * (`selectAnalysedParcelAtom`); the neighbouring parcels the API answered but the user
 * left out are not clickable. Runs inside `<Map>`, mounted from `MiniMap`.
 */
export function useAnalysedParcelClick() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const analysedIds = useAtomValue(analysedParcelIdsAtom);
  const { data } = useQuery(parcelQueries.filtered(polygons));
  const selectParcel = useSetAtom(selectAnalysedParcelAtom);

  const parcels = useMemo(
    () => data?.results.filter((parcel) => analysedIds.includes(parcel.parcel_id)),
    [data, analysedIds],
  );

  useParcelHitClick({ parcels, enabled: true, onParcel: selectParcel });
}
