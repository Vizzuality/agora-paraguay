import { categoryCountWidgets, type CategoryCountWidget } from '@/lib/analysis/category-counts';
import { indicatorCards, type IndicatorCard } from '@/lib/analysis/indicator-cards';
import { numberWidgets, type NumberWidget } from '@/lib/analysis/number-widget';
import { parcelValueWidgets, type ParcelValuesWidget } from '@/lib/analysis/parcel-values';
import { valueHistogramWidgets, type ValueHistogramWidget } from '@/lib/analysis/value-histogram';
import type { ParcelScope } from '@/lib/analysis/widget-config';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicators, Riesgo } from '@/lib/api/metadata/schemas';

export type AnalysisWidget =
  | ({ kind: 'ruler' } & IndicatorCard)
  | ({ kind: 'parcel-list' } & ParcelValuesWidget)
  | ({ kind: 'bar-chart' } & CategoryCountWidget)
  | ({ kind: 'histogram' } & ValueHistogramWidget)
  | ({ kind: 'number' } & NumberWidget);

export type AnalysisWidgetsInput = {
  /** The answer's parcels, matched by id — the backend need not echo them in request order. */
  parcels: AnalysisParcel[];
  /** The parcels Analizar submitted, in submission order. */
  parcelIds: string[];
  indicators: Indicators | undefined;
  riesgo: Riesgo;
  /** One parcel (a parcel tab) or the whole selection (Todas). */
  scope: ParcelScope;
  /**
   * The parcel the open tab points at — what the risk-class cards read and the only
   * parcel the value lists row — or, under Todas, the set combined (`combinedParcel`).
   */
  parcel: AnalysisParcel | null | undefined;
};

/**
 * Every widget the shown indicators produce, in metadata order, whatever its kind:
 * a risk card for a classed reading of one parcel, a list of every parcel's number, a
 * count of the parcels per class, a histogram of their values over a scale, one parcel's
 * number on that scale. Which
 * kind an indicator takes is `widgetFor`'s
 * call, by riesgo and scope; each kind's builder answers only the indicators that are
 * its own, so an indicator lands in at most one widget.
 */
export function analysisWidgets({
  parcels,
  parcelIds,
  indicators,
  riesgo,
  scope,
  parcel,
}: AnalysisWidgetsInput): AnalysisWidget[] {
  const cards = new Map(
    indicatorCards(parcel, indicators, riesgo, scope).map((card) => [card.id, card]),
  );
  // A parcel tab lists that parcel alone; Todas lists the whole submission.
  const listed = scope === 'individual' && parcel ? [String(parcel.parcel_id)] : parcelIds;
  const values = new Map(
    parcelValueWidgets(parcels, parcelIds, indicators, riesgo, listed).map((widget) => [
      widget.id,
      widget,
    ]),
  );
  const counts = new Map(
    categoryCountWidgets(parcels, parcelIds, indicators, riesgo, scope).map((widget) => [
      widget.id,
      widget,
    ]),
  );
  const histograms = new Map(
    valueHistogramWidgets(parcels, parcelIds, indicators, riesgo, scope).map((widget) => [
      widget.id,
      widget,
    ]),
  );
  const numbers = new Map(
    numberWidgets(parcels, parcelIds, indicators, riesgo, scope, parcel).map((widget) => [
      widget.id,
      widget,
    ]),
  );

  return (indicators ?? []).flatMap((indicator): AnalysisWidget[] => {
    const card = cards.get(indicator.id);
    if (card) return [{ kind: 'ruler', ...card }];

    const value = values.get(indicator.id);
    if (value) return [{ kind: 'parcel-list', ...value }];

    const count = counts.get(indicator.id);
    if (count) return [{ kind: 'bar-chart', ...count }];

    const histogram = histograms.get(indicator.id);
    if (histogram) return [{ kind: 'histogram', ...histogram }];

    const number = numbers.get(indicator.id);
    if (number) return [{ kind: 'number', ...number }];

    return [];
  });
}
