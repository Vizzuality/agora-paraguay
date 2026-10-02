import { applicableIndicators } from '@/lib/analysis/applicable-indicators';
import { CROP_FILTER_ID } from '@/lib/analysis/filters';
import { useAnalysis } from '@/lib/analysis/use-analysis';
import { useHeroFilters } from '@/lib/analysis/use-hero-filters';
import type { Riesgo } from '@/lib/api/metadata/schemas';

/**
 * The riesgo's indicators that apply to the analysed selection, for the picker and the
 * widgets: the fetched list, minus the other crop's and what the analysis answered "NA"
 * for every parcel (`applicableIndicators`). Same queries the page runs, so no extra
 * request. Reads atoms, so callers render inside `<ClientOnly>`.
 */
export function useApplicableIndicators(riesgo: Riesgo) {
  const { analysis, indicators, indicatorsError, parcelIds } = useAnalysis(riesgo);
  const { resolvedFilters } = useHeroFilters(riesgo);
  const applicable = applicableIndicators(
    indicators,
    analysis.data?.indicators ?? [],
    parcelIds,
    riesgo,
    resolvedFilters?.[CROP_FILTER_ID],
  );

  return { analysis, indicators: applicable, indicatorsError, parcelIds };
}
