import { useAtomValue } from 'jotai';

import { parcelArea, type ParcelArea } from '@/lib/analysis/area';
import { useAnalysis } from '@/lib/analysis/use-analysis';
import type { Riesgo } from '@/lib/api/metadata/schemas';
import { activeParcelIdAtom } from '@/store/analysis';

/**
 * The area of the hero's open tab, from the same analysis query the page runs (same key,
 * no second request). `null` until the answer lands or when it carries no area. Reads
 * atoms, so callers render inside `<ClientOnly>`.
 */
export function useParcelArea(riesgo: Riesgo): ParcelArea | null {
  const { analysis, indicators, parcelIds } = useAnalysis(riesgo);
  const activeId = useAtomValue(activeParcelIdAtom);
  const answered = (analysis.data?.indicators ?? []).filter((parcel) =>
    parcelIds.includes(String(parcel.parcel_id)),
  );

  return parcelArea(answered, activeId, indicators);
}
