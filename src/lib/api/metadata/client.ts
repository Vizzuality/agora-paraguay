import { env } from '@/env';
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
 * The only module in `metadata/` that knows which data is fake: filters are real;
 * indicators and the legacy analysis options run on the mock branch.
 */

/** `GET /api/filters/` — the filters and their values. */
export async function fetchFilters(): Promise<Filters> {
  return filtersSchema.parse(await getJson('/api/filters/'));
}

/**
 * `GET /api/indicators/` — the indicators and their metadata, optionally by riesgo/cultivo.
 *
 * TODO(mock-indicators): the mock branch answers the spec's example for any params;
 * drop it when the endpoint is reachable (grep `mock-indicators`).
 */
export async function fetchIndicators(params: IndicatorsParams = {}): Promise<Indicators> {
  if (env.VITE_USE_MOCK_API) {
    const { indicatorsFixture } = await import('./fixtures/indicators');

    return indicatorsSchema.parse(indicatorsFixture);
  }

  return indicatorsSchema.parse(await getJson('/api/indicators/', params));
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
