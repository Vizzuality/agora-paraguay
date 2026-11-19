import { hasColumn, readingOf } from '@/lib/analysis/readings';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import {
  type Crop,
  type Indicator,
  type Indicators,
  isCrop,
  type Riesgo,
} from '@/lib/api/metadata/schemas';

/*
 * TODO(api-filters): remove this file, its hook (`use-applicable-indicators.ts`) and its
 * tests once the API applies the filters itself — listing only the crop's indicators and
 * answering only those. The widgets and the picker then read the list as it comes.
 *
 * The API lists every indicator for every crop (`Pro_soja`, `Pro_arroz`, …) and the
 * analysis answers them all whatever the crop. Which ones apply is the selected crop: an
 * indicator bound to a crop by its id shows only for that crop; on productivo one the
 * answer marks "NA" for every parcel is out too. The list is fetched once; this is what makes
 * it follow the crop. Pure, node-tested.
 */

/**
 * The crop an indicator id is bound to, as the crop filter's value: `soja` for a `_soja` or
 * `_soy` part (`Pro_soja`, `LOW_H5_soja`), `rice` for `_arroz` or `_rice`; `null` for one
 * that applies to every crop.
 */
export function cropOfIndicator(indicator: Indicator): Crop | null {
  if (/_(soja|soy)(?=_|$)/i.test(indicator.id)) return 'soja';
  if (/_(arroz|rice)(?=_|$)/i.test(indicator.id)) return 'rice';

  return null;
}

/**
 * The indicators that apply to the analysed selection. On either riesgo, those bound to
 * the other crop are out: rice lists none with `_soja`/`_soy`, soy none with
 * `_arroz`/`_rice`. On productivo, so is one the answer carries for some submitted parcel
 * but no parcel has a reading for (every value "NA", blank or null); one the answer does
 * not carry at all stays: nothing is known about it yet. Under Todos, or without a crop
 * yet (filters loading), the crop rule waits: every crop's indicators apply, the
 * crop-agnostic ones always do.
 */
export function applicableIndicators(
  indicators: Indicators | undefined,
  parcels: AnalysisParcel[],
  parcelIds: string[],
  riesgo: Riesgo,
  crop: string | undefined,
): Indicators | undefined {
  if (!indicators) return indicators;

  const forCrop = !isCrop(crop)
    ? indicators
    : indicators.filter((indicator) => {
        const bound = cropOfIndicator(indicator);

        return bound === null || bound === crop;
      });

  if (riesgo !== 'productivo') return forCrop;

  const byId = new Map(parcels.map((parcel) => [String(parcel.parcel_id), parcel]));
  const submitted = parcelIds.flatMap((parcelId) => byId.get(parcelId) ?? []);
  // The answer is for the submitted parcels; when it echoes their ids in another form,
  // judge over the answer as it came rather than keep everything.
  const pool = submitted.length > 0 ? submitted : parcels;

  return forCrop.filter((indicator) => {
    const answered = pool.filter((parcel) => hasColumn(parcel, indicator.id));

    if (answered.length === 0) return true;

    return answered.some((parcel) => readingOf(parcel, indicator.id) !== undefined);
  });
}
