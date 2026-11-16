import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { MapLoading } from '@/components/map/map-loading';
import { parcelQueries } from '@/lib/api/parcels/queries';
import { drawPolygonsAtom } from '@/store/draw';

/** Veils the map while `filter-parcels` looks up the parcels for the areas just landed. */
export function ParcelsLookup() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const { isFetching } = useQuery(parcelQueries.filtered(polygons));

  return isFetching ? <MapLoading>Buscando parcelas…</MapLoading> : null;
}
