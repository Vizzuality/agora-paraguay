import { categoryCountTiles, type CategoryCountTile } from '@/lib/analysis/category-counts';
import { indicatorCards, type IndicatorCard } from '@/lib/analysis/indicator-cards';
import { parcelValueTiles, type ParcelValuesTile } from '@/lib/analysis/parcel-values';
import type { ParcelScope } from '@/lib/analysis/widget-config';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicators, Riesgo } from '@/lib/api/metadata/schemas';

export type AnalysisTile =
  | ({ kind: 'risk-class' } & IndicatorCard)
  | ({ kind: 'parcel-values' } & ParcelValuesTile)
  | ({ kind: 'category-count' } & CategoryCountTile);

export type AnalysisTilesInput = {
  /** The answer's parcels, matched by id — the backend need not echo them in request order. */
  parcels: AnalysisParcel[];
  /** The parcels Analizar submitted, in submission order. */
  parcelIds: string[];
  indicators: Indicators | undefined;
  riesgo: Riesgo;
  /** One parcel (a parcel tab) or the whole selection (Todas). */
  scope: ParcelScope;
  /** The parcel the risk-class cards read: the open tab's, or the set combined (`combinedParcel`). */
  parcel: AnalysisParcel | null | undefined;
};

/**
 * Every widget tile the shown indicators produce, in metadata order, whatever its kind:
 * a risk card for a classed reading of one parcel, a list of every parcel's number, a
 * count of the parcels per category. Which kind an indicator takes is `widgetKindOf`'s
 * call, by riesgo and scope; each kind's builder answers only the indicators that are
 * its own, so an indicator lands in at most one tile.
 */
export function analysisTiles({
  parcels,
  parcelIds,
  indicators,
  riesgo,
  scope,
  parcel,
}: AnalysisTilesInput): AnalysisTile[] {
  const cards = new Map(
    indicatorCards(parcel, indicators, riesgo, scope).map((card) => [card.id, card]),
  );
  const values = new Map(
    parcelValueTiles(parcels, parcelIds, indicators, riesgo).map((tile) => [tile.id, tile]),
  );
  const counts = new Map(
    categoryCountTiles(parcels, parcelIds, indicators, riesgo, scope).map((tile) => [
      tile.id,
      tile,
    ]),
  );

  return (indicators ?? []).flatMap((indicator): AnalysisTile[] => {
    const card = cards.get(indicator.id);
    if (card) return [{ kind: 'risk-class', ...card }];

    const value = values.get(indicator.id);
    if (value) return [{ kind: 'parcel-values', ...value }];

    const count = counts.get(indicator.id);
    if (count) return [{ kind: 'category-count', ...count }];

    return [];
  });
}
