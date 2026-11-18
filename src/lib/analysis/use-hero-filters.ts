import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { CROP_FILTER_ID, resolveFilterSelection } from '@/lib/analysis/filters';
import { useLastCrop } from '@/lib/analysis/use-last-crop';
import { metadataQueries } from '@/lib/api/metadata/queries';
import { isCrop, type Riesgo } from '@/lib/api/metadata/schemas';
import { analysisFiltersAtom } from '@/store/analysis';

/**
 * The hero filters of a riesgo and what they resolve to — the user's picks over the
 * API's defaults (`resolveFilterSelection`); on productivo the crop defaults to what the
 * parcels in view last grew (`useLastCrop`). The list depends on the crop, so it is keyed
 * by the crop in force: the user's pick, else the default crop. Soy's list is the first one asked,
 * so landing makes one request, re-picking soy makes none (same key), and only another
 * crop asks again. A crop value the app does not know reads as soy. `resolvedFilters`
 * is `null` until the list has loaded. Reads an atom, so callers render inside
 * `<ClientOnly>`.
 */
export function useHeroFilters(riesgo: Riesgo) {
  const selected = useAtomValue(analysisFiltersAtom);
  const lastCrop = useLastCrop();
  // Productivo's crop starts at what the parcels in view last grew.
  const defaultCrop = riesgo === 'productivo' ? lastCrop : undefined;
  const seed = useQuery(metadataQueries.filters({ riesgo }));
  const picked = seed.data
    ? resolveFilterSelection(selected, seed.data, defaultCrop)[CROP_FILTER_ID]
    : undefined;
  const crop = isCrop(picked) ? picked : undefined;
  const byCrop = useQuery({
    ...metadataQueries.filters({ riesgo, crop_type: crop }),
    enabled: crop !== undefined,
  });
  const filters = byCrop.data ? byCrop : seed;
  const resolvedFilters = filters.data
    ? resolveFilterSelection(selected, filters.data, defaultCrop)
    : null;

  return { filters, resolvedFilters };
}
