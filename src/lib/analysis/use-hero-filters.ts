import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import {
  type AnalysisFilterSelection,
  CROP_FILTER_ID,
  EMPTY_ANALYSIS_FILTERS,
  resolveFilterSelection,
} from '@/lib/analysis/filters';
import { metadataQueries } from '@/lib/api/metadata/queries';
import type { Riesgo } from '@/lib/api/metadata/schemas';
import { analysisFiltersAtom } from '@/store/analysis';

/**
 * The hero filters of a riesgo and what they resolve to — the user's picks over the
 * API's defaults (`resolveFilterSelection`). The list depends on the crop, so it is keyed
 * by the crop in force: the user's pick, else the first option. That default is only known
 * from the first answer (asked without a crop, the API's default applies), which then
 * seeds the default crop's entry — so landing makes one request, re-picking the default
 * makes none, and only another crop asks again. `resolvedFilters` is `null` until the list
 * has loaded. Reads an atom, so callers render inside `<ClientOnly>`.
 */
export function useHeroFilters(riesgo: Riesgo) {
  const selected = useAtomValue(analysisFiltersAtom);
  const seed = useQuery(metadataQueries.filters({ riesgo }));
  const cropOf = (picks: AnalysisFilterSelection) =>
    seed.data ? resolveFilterSelection(picks, seed.data)[CROP_FILTER_ID] : undefined;
  const crop = cropOf(selected);
  const byCrop = useQuery({
    ...metadataQueries.filters({ riesgo, crop_type: crop }),
    enabled: crop !== undefined,
    // The default crop's list is what the seed answered: its entry starts filled.
    initialData:
      crop !== undefined && crop === cropOf(EMPTY_ANALYSIS_FILTERS) ? seed.data : undefined,
    initialDataUpdatedAt: seed.dataUpdatedAt,
  });
  const filters = byCrop.data ? byCrop : seed;
  const resolvedFilters = filters.data ? resolveFilterSelection(selected, filters.data) : null;

  return { filters, resolvedFilters };
}
