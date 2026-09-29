import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { resolveFilterSelection } from '@/lib/analysis/filters';
import { visibilityOf } from '@/lib/analysis/request';
import { metadataQueries } from '@/lib/api/metadata/queries';
import type { Riesgo } from '@/lib/api/metadata/schemas';
import { analysisFiltersAtom } from '@/store/analysis';

/**
 * The hero filters of a riesgo and what they resolve to — the user's picks over the
 * API's defaults (`resolveFilterSelection`). `resolvedFilters` is `null` until the list
 * has loaded. Reads an atom, so callers render inside `<ClientOnly>`.
 */
export function useHeroFilters(riesgo: Riesgo) {
  const selected = useAtomValue(analysisFiltersAtom);
  const filters = useQuery(metadataQueries.filters({ visibility: visibilityOf(riesgo) }));
  const resolvedFilters = filters.data ? resolveFilterSelection(selected, filters.data) : null;

  return { filters, resolvedFilters };
}
