import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { CROP_FILTER_ID, resolveFilterSelection } from '@/lib/analysis/filters';
import { withCropOptions } from '@/lib/analysis/parcel-crops';
import { useParcelCrops } from '@/lib/analysis/use-parcel-crops';
import { metadataQueries } from '@/lib/api/metadata/queries';
import { isCrop, type Riesgo } from '@/lib/api/metadata/schemas';
import { analysisFiltersAtom } from '@/store/analysis';

/**
 * The hero filters of a riesgo and what they resolve to — the user's picks over the
 * API's defaults (`resolveFilterSelection`). The crop dropdown offers every crop, Todos too
 * on productivo (`withCropOptions`), and starts at what the parcels in view last grew
 * (`useParcelCrops`). The list depends on
 * the crop, so it is keyed by the crop in force: the user's pick, else the default crop.
 * Soy's list is the first one asked, so landing makes one request, re-picking soy makes
 * none (same key), and only another crop asks again; Todos asks for no crop. A crop
 * value the app does not know reads as soy. `resolvedFilters` is `null` until the list
 * has loaded. Reads an atom, so callers render inside `<ClientOnly>`.
 */
export function useHeroFilters(riesgo: Riesgo) {
  const selected = useAtomValue(analysisFiltersAtom);
  const { lastCrop } = useParcelCrops();
  const seed = useQuery(metadataQueries.filters({ riesgo }));
  const seedFilters = seed.data && withCropOptions(seed.data, riesgo);
  const picked = seedFilters
    ? resolveFilterSelection(selected, seedFilters, lastCrop)[CROP_FILTER_ID]
    : undefined;
  const crop = isCrop(picked) ? picked : undefined;
  const byCrop = useQuery({
    ...metadataQueries.filters({ riesgo, crop_type: crop }),
    enabled: crop !== undefined,
  });
  const source = byCrop.data ? byCrop : seed;
  const data = source.data && withCropOptions(source.data, riesgo);
  const resolvedFilters = data ? resolveFilterSelection(selected, data, lastCrop) : null;

  return { filters: { data, error: source.error }, resolvedFilters, lastCrop };
}
