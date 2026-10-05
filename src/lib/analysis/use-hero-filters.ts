import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { CROP_FILTER_ID, resolveFilterSelection } from '@/lib/analysis/filters';
import { metadataQueries } from '@/lib/api/metadata/queries';
import type { Riesgo } from '@/lib/api/metadata/schemas';
import { analysisFiltersAtom } from '@/store/analysis';

/**
 * The hero filters of a riesgo and what they resolve to — the user's picks over the
 * API's defaults (`resolveFilterSelection`). The list is asked for the crop the user
 * picked, since the other filters follow it; untouched, the API's default crop applies.
 * `resolvedFilters` is `null` until the list has loaded. Reads an atom, so callers render
 * inside `<ClientOnly>`.
 */
export function useHeroFilters(riesgo: Riesgo) {
  const selected = useAtomValue(analysisFiltersAtom);
  const filters = useQuery(
    metadataQueries.filters({ riesgo, crop_type: selected[CROP_FILTER_ID] }),
  );
  const resolvedFilters = filters.data ? resolveFilterSelection(selected, filters.data) : null;

  return { filters, resolvedFilters };
}
