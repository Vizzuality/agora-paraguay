import { describeWithFilters } from '@/lib/analysis/describe';
import { useHeroFilters } from '@/lib/analysis/use-hero-filters';
import type { Riesgo } from '@/lib/api/metadata/schemas';

/**
 * A description with its filter references resolved against the hero's current picks
 * (`describeWithFilters`). Until the filters load, the description is left as the API
 * wrote it. Reads an atom, so callers render inside `<ClientOnly>`.
 */
export function useDescribe(riesgo: Riesgo) {
  const {
    filters: { data: filters },
    resolvedFilters,
  } = useHeroFilters(riesgo);

  return (description: string | undefined): string | undefined =>
    description !== undefined && filters && resolvedFilters
      ? describeWithFilters(description, filters, resolvedFilters)
      : description;
}
