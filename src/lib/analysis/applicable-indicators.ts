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

/** The crop a word names, as the crop filter's value. */
function cropOfWord(word: string): Crop | null {
  if (/^(soja|soy)$/i.test(word)) return 'soja';
  if (/^(arroz|rice)$/i.test(word)) return 'rice';

  return null;
}

/**
 * The crop an indicator is bound to, as the crop filter's value (`soja`, `rice`), or `null`
 * for one every crop shares. Its `crop_type` when the API sends one (sanitario's diseases);
 * else a `_soja`/`_soy` or `_arroz`/`_rice` part of its id (`Pro_soja`, `LOW_H5_soja`),
 * which is all productivo's list carries so far.
 */
export function cropOfIndicator(indicator: Indicator): Crop | null {
  if (indicator.crop_type) return cropOfWord(indicator.crop_type);

  const part = /_(soja|soy|arroz|rice)(?=_|$)/i.exec(indicator.id);

  return part ? cropOfWord(part[1]) : null;
}

/**
 * The indicators that apply to the analysed selection. On either riesgo, those bound to
 * the other crop are out: rice lists none with `_soja`/`_soy`, soy none with
 * `_arroz`/`_rice`. On productivo, so is one the answer carries for some submitted parcel
 * but no parcel has a reading for (every value "NA", blank or null); one the answer does
 * not carry at all stays: nothing is known about it yet. Under Todos every crop's apply,
 * whatever the parcels grew: one run per crop answers them. Without a crop yet (filters
 * loading) the crop rule waits. The crop-agnostic ones always do.
 */
export function applicableIndicators(
  indicators: Indicators | undefined,
  parcels: AnalysisParcel[],
  parcelIds: string[],
  riesgo: Riesgo,
  crop: string | undefined,
): Indicators | undefined {
  if (!indicators) return indicators;

  // One crop picked: the other's are out. Todos, or no crop yet: every crop's stay.
  const forCrop = isCrop(crop)
    ? indicators.filter((indicator) => {
        const bound = cropOfIndicator(indicator);

        return bound === null || bound === crop;
      })
    : indicators;

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
