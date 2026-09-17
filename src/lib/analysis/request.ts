import type { ResolvedAnalysisFilters } from '@/lib/analysis/filters';
import type { AnalysisRequest, AnalysisVisibility } from '@/lib/api/analysis/schemas';
import type { Indicator, Riesgo } from '@/lib/api/metadata/schemas';

/*
 * Builds the `POST /api/analysis/{visibility}` body out of app state — pure, node-tested.
 * The hero vocabulary (fechaSiembra, cultivo, …) is mapped to the wire filters here and
 * nowhere else.
 */

/** Which riesgo tab a visibility is: sanitario is public, productivo private. */
export function riesgoOf(visibility: AnalysisVisibility): Riesgo {
  return visibility === 'public' ? 'sanitario' : 'productivo';
}

/** The inverse: which analysis path serves a riesgo tab. */
export function visibilityOf(riesgo: Riesgo): AnalysisVisibility {
  return riesgo === 'sanitario' ? 'public' : 'private';
}

/** The indicators flagged `default`, or every indicator when the API flags none. */
export function defaultIndicatorIds(indicators: Indicator[]): string[] {
  const defaults = indicators.filter((indicator) => indicator.default === true);

  return (defaults.length > 0 ? defaults : indicators).map((indicator) => indicator.id);
}

/**
 * Sanitario (public) reads the four hero dropdowns: the crop cycle bounded by the
 * sowing and analysis dates. Productivo (private) reads the period only.
 */
export function toAnalysisRequest(
  visibility: AnalysisVisibility,
  parcelIds: number[],
  filters: ResolvedAnalysisFilters,
  indicators: string[],
): AnalysisRequest {
  const wireFilters =
    visibility === 'public'
      ? {
          crop: filters.cultivo,
          cycle: filters.ciclo,
          start_date: filters.fechaSiembra,
          end_date: filters.fechaAnalisis,
        }
      : { start_date: filters.fechaInicio, end_date: filters.fechaFin };

  return { parcel_ids: parcelIds, filters: { ...wireFilters, indicators } };
}
