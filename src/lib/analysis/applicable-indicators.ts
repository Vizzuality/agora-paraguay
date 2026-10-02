import { hasColumn, readingOf } from '@/lib/analysis/readings';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicator, Indicators, Riesgo } from '@/lib/api/metadata/schemas';

/*
 * TODO(api-filters): remove this file, its hook (`use-applicable-indicators.ts`) and its
 * tests once the API applies the filters itself — listing only the crop's indicators and
 * answering only those. The widgets and the picker then read the list as it comes.
 *
 * Riesgo productivo lists every indicator for every crop (`Pro_soja`, `Pro_arroz`, …)
 * and the analysis answers them all whatever the crop. Which ones apply is the hero's
 * crop: an indicator bound to a crop by its id shows only for that crop; one the answer
 * marks "NA" for every parcel is out too. The list is fetched once; this is what makes
 * it follow the crop. Pure, node-tested.
 */

/** The crop filter's values (`crop_type` options) → the suffix the indicator ids carry. */
const CROP_SUFFIX: Record<string, string> = { soy: 'soja', rice: 'arroz' };

/** The crop an indicator id is bound to (`_soja`, `_arroz`), or `null` for one that applies to all. */
export function cropOfIndicator(indicator: Indicator): string | null {
  const match = /_(soja|arroz)$/i.exec(indicator.id);

  return match === null ? null : match[1].toLowerCase();
}

/**
 * The indicators that apply to the analysed selection on productivo: those bound to
 * another crop than the hero's are out; so is one the answer carries for some submitted
 * parcel but no parcel has a reading for (every value "NA", blank or null). One the
 * answer does not carry at all stays: nothing is known about it yet. Sanitario's list is
 * left as is. Without a crop yet (filters loading) the crop rule waits.
 */
export function applicableIndicators(
  indicators: Indicators | undefined,
  parcels: AnalysisParcel[],
  parcelIds: string[],
  riesgo: Riesgo,
  crop: string | undefined,
): Indicators | undefined {
  if (!indicators || riesgo !== 'productivo') return indicators;

  const suffix = crop === undefined ? undefined : (CROP_SUFFIX[crop] ?? crop.toLowerCase());
  const byId = new Map(parcels.map((parcel) => [String(parcel.parcel_id), parcel]));
  const submitted = parcelIds.flatMap((parcelId) => byId.get(parcelId) ?? []);
  // The answer is for the submitted parcels; when it echoes their ids in another form,
  // judge over the answer as it came rather than keep everything.
  const pool = submitted.length > 0 ? submitted : parcels;

  return indicators.filter((indicator) => {
    const bound = cropOfIndicator(indicator);

    if (bound !== null && suffix !== undefined && bound !== suffix) return false;

    const answered = pool.filter((parcel) => hasColumn(parcel, indicator.id));

    if (answered.length === 0) return true;

    return answered.some((parcel) => readingOf(parcel, indicator.id) !== undefined);
  });
}
