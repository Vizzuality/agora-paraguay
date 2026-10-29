import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { CROP_FILTER_ID, resolveFilterSelection } from '@/lib/analysis/filters';
import { metadataQueries } from '@/lib/api/metadata/queries';
import { isCrop, type Riesgo } from '@/lib/api/metadata/schemas';
import { analysisFiltersAtom } from '@/store/analysis';

/**
 * The hero filters of a riesgo and what they resolve to — the user's picks over the
 * API's defaults (`resolveFilterSelection`). The list depends on the crop, so it is keyed
 * by the crop in force: the user's pick, else soy. Soy's list is the first one asked,
 * so landing makes one request, re-picking soy makes none (same key), and only another
 * crop asks again. A crop value the app does not know reads as soy. `resolvedFilters`
 * is `null` until the list has loaded. Reads an atom, so callers render inside
 * `<ClientOnly>`.
 */
export function useHeroFilters(riesgo: Riesgo) {
  const selected = useAtomValue(analysisFiltersAtom);
  const seed = useQuery(metadataQueries.filters({ riesgo }));
  const picked = seed.data
    ? resolveFilterSelection(selected, seed.data)[CROP_FILTER_ID]
    : undefined;
  const crop = isCrop(picked) ? picked : undefined;
  const byCrop = useQuery({
    ...metadataQueries.filters({ riesgo, crop_type: crop }),
    enabled: crop !== undefined,
  });
  const filters = byCrop.data ? byCrop : seed;
  const resolvedFilters = filters.data ? resolveFilterSelection(selected, filters.data) : null;

  return { filters, resolvedFilters };
}
