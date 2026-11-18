import type { Crop } from '@/lib/api/metadata/schemas';
import type { FilteredParcel } from '@/lib/api/parcels/schemas';

/**
 * The crop `ids` last grew, from each parcel's `last_crop_type`: one parcel's own, or the
 * one most of them grew. Parcels with no known crop do not count. A tie, or no crop known,
 * is `undefined`, and the caller keeps its own default.
 */
export function lastCrop(
  parcels: readonly FilteredParcel[],
  ids: readonly string[],
): Crop | undefined {
  const counts = new Map<Crop, number>();

  for (const parcel of parcels) {
    const crop = parcel.last_crop_type;
    if (crop && ids.includes(parcel.parcel_id)) counts.set(crop, (counts.get(crop) ?? 0) + 1);
  }

  const [first, second] = [...counts].sort(([, a], [, b]) => b - a);

  return first && first[1] !== second?.[1] ? first[0] : undefined;
}
