import { CROP_FILTER_ID } from '@/lib/analysis/filters';
import { CROPS, type Crop, type Filters } from '@/lib/api/metadata/schemas';
import type { FilteredParcel } from '@/lib/api/parcels/schemas';

/** The crop filter's "every crop" value: no crop sent, every crop's indicators shown. */
export const ALL_CROPS = 'todos';

const CROP_LABELS: Record<Crop, string> = { rice: 'Arroz', soja: 'Soja' };

/** The crops the parcels `ids` have grown (`crop_types`), each once, in `CROPS` order. */
export function parcelCrops(parcels: readonly FilteredParcel[], ids: readonly string[]): Crop[] {
  const grown = new Set(
    parcels
      .filter((parcel) => ids.includes(parcel.parcel_id))
      .flatMap((parcel) => parcel.crop_types),
  );

  return CROPS.filter((crop) => grown.has(crop));
}

/**
 * The filters with the crop dropdown offering the parcels' crops — Todos first when they
 * grew more than one — labelled as the API labels them. Left as the API lists it while no
 * parcel's crops are known.
 */
export function withParcelCropOptions(filters: Filters, crops: readonly Crop[]): Filters {
  if (crops.length === 0) return filters;

  return filters.map((filter) => {
    const field = filter.field_type;

    if (filter.id !== CROP_FILTER_ID || field.type !== 'category') return filter;

    const label = (crop: Crop) =>
      field.options.find((option) => option.value === crop)?.label ?? CROP_LABELS[crop];
    const options = crops.map((crop) => ({ value: crop, label: label(crop) }));

    return {
      ...filter,
      field_type: {
        ...field,
        options: crops.length > 1 ? [{ value: ALL_CROPS, label: 'Todos' }, ...options] : options,
      },
    };
  });
}
