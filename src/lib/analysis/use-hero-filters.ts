import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { CROP_FILTER_ID, defaultCrop, resolveFilterSelection } from '@/lib/analysis/filters';
import { metadataQueries } from '@/lib/api/metadata/queries';
import type { Riesgo } from '@/lib/api/metadata/schemas';
import { analysisFiltersAtom } from '@/store/analysis';

/**
 * The hero filters of a riesgo and what they resolve to — the user's picks over the
 * API's defaults (`resolveFilterSelection`). The list depends on the crop, so it is keyed
 * by the crop in force: the user's pick, else the default. The default is only known
 * from the first answer (asked without a crop, the API's default applies), which then
 * seeds the default crop's entry — so landing makes one request, re-picking the default
 * makes none, and only another crop asks again. `resolvedFilters` is `null` until the list
 * has loaded. Reads an atom, so callers render inside `<ClientOnly>`.
 */
export function useHeroFilters(riesgo: Riesgo) {
  const selected = useAtomValue(analysisFiltersAtom);
  const seed = useQuery(metadataQueries.filters({ riesgo }));
  const fallback = seed.data ? defaultCrop(seed.data) : undefined;
  const crop = selected[CROP_FILTER_ID] ?? fallback;
  const byCrop = useQuery({
    ...metadataQueries.filters({ riesgo, crop_type: crop }),
    enabled: crop !== undefined,
    // The default crop's list is what the seed answered: its entry starts filled.
    initialData: crop !== undefined && crop === fallback ? seed.data : undefined,
    initialDataUpdatedAt: seed.dataUpdatedAt,
  });
  const filters = byCrop.data ? byCrop : seed;
  const resolvedFilters = filters.data ? resolveFilterSelection(selected, filters.data) : null;

  return { filters, resolvedFilters };
}
