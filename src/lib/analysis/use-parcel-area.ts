import { useAtomValue } from 'jotai';

import { parcelArea, type ParcelArea } from '@/lib/analysis/area';
import { useAnalysis } from '@/lib/analysis/use-analysis';
import { activeParcelIdAtom } from '@/store/analysis';

/**
 * The area of the hero's open tab, the same on both analysis pages: it is a fact of the
 * selection, and the diseases analysis is the one that answers it (`area` is on the
 * sanitario indicator list). Same query the sanitario page runs — same key, so a tab
 * switch never asks twice. `null` until the answer lands. Reads atoms, so callers render
 * inside `<ClientOnly>`.
 */
export function useParcelArea(): ParcelArea | null {
  const { analysis, indicators, parcelIds } = useAnalysis('sanitario');
  const activeId = useAtomValue(activeParcelIdAtom);
  const answered = (analysis.data?.indicators ?? []).filter((parcel) =>
    parcelIds.includes(String(parcel.parcel_id)),
  );

  return parcelArea(answered, activeId, indicators);
}
