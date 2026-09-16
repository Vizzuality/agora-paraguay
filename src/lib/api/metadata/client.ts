import { env } from '@/env';
import { visibilityOf } from '@/lib/analysis/request';
import { analysisPath } from '@/lib/api/analysis/schemas';
import { getJson } from '@/lib/api/http';

import {
  analysisOptionsSchema,
  filtersSchema,
  indicatorsSchema,
  type AnalysisOptions,
  type Filters,
  type Indicators,
  type IndicatorsParams,
} from './schemas';

/*
 * The only module in `metadata/` that knows which data is fake: filters and indicators
 * are real; only the legacy analysis options run on the mock branch.
 */

/** `GET /api/filters/` — the filters and their values. */
export async function fetchFilters(): Promise<Filters> {
  return filtersSchema.parse(await getJson('/api/filters/'));
}

/**
 * `GET /api/analysis/{public|private}` — the indicators of a riesgo and their metadata.
 * Same path the analysis is POSTed to; the verb tells them apart.
 */
export async function fetchIndicators(params: IndicatorsParams): Promise<Indicators> {
  return indicatorsSchema.parse(
    await getJson(analysisPath(visibilityOf(params.riesgo)), { cultivo: params.cultivo }),
  );
}

/**
 * TODO(mock-analysis-options): serves the option lists for the analysis hero dropdowns
 * from a fixture. Replace with `fetchFilters` and delete `fixtures/analysis-options.ts`
 * (grep `mock-analysis-options`).
 */
export async function fetchAnalysisOptions(): Promise<AnalysisOptions> {
  if (env.VITE_USE_MOCK_API) {
    const { analysisOptionsFixture } = await import('./fixtures/analysis-options');

    return analysisOptionsSchema.parse(analysisOptionsFixture);
  }

  throw new Error(
    'The real API client is not implemented. Set VITE_USE_MOCK_API=true to serve fixtures.',
  );
}
