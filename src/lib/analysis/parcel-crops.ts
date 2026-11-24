import { CROP_FILTER_ID } from '@/lib/analysis/filters';
import { CROPS, type Crop, type Filters, type Riesgo } from '@/lib/api/metadata/schemas';
import type { FilteredParcel } from '@/lib/api/parcels/schemas';
import { ALL_CROPS_LABEL, CROP_NAMES } from '@/lib/platform-metadata';

/** The crop filter's "every crop" value: no crop sent, every crop's indicators shown. */
export const ALL_CROPS = 'todos';

const CROP_LABELS: Readonly<Record<Crop, string>> = CROP_NAMES;

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
 * The filters with the crop dropdown offering every crop, whatever the parcels grew, labelled
 * as the API labels them; productivo adds Todos first (one run per crop, merged). Sanitario
 * never does: the diseases analysis reads one crop.
 */
export function withCropOptions(filters: Filters, riesgo: Riesgo): Filters {
  return filters.map((filter) => {
    const field = filter.field_type;

    if (filter.id !== CROP_FILTER_ID || field.type !== 'category') return filter;

    const label = (crop: Crop) =>
      field.options.find((option) => option.value === crop)?.label ?? CROP_LABELS[crop];
    const options = CROPS.map((crop) => ({ value: crop, label: label(crop) }));

    return {
      ...filter,
      field_type: {
        ...field,
        options:
          riesgo === 'productivo'
            ? [{ value: ALL_CROPS, label: ALL_CROPS_LABEL }, ...options]
            : options,
      },
    };
  });
}
