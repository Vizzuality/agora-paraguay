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
 * The only module in `metadata/` that knows which data is fake. Today only auth talks to
 * the API: with `VITE_USE_MOCK_API` on (the default) every function here serves its
 * fixture; off, filters and indicators hit the backend and the analysis options, which
 * have no endpoint yet, throw.
 */

/**
 * `GET /api/filters/` — the filters and their values.
 *
 * TODO(mock-filters): the mock branch answers the spec's example; drop it when the
 * endpoint is reachable (grep `mock-filters`).
 */
export async function fetchFilters(): Promise<Filters> {
  if (env.VITE_USE_MOCK_API) {
    const { filtersFixture } = await import('./fixtures/filters');

    return filtersSchema.parse(filtersFixture);
  }

  return filtersSchema.parse(await getJson('/api/filters/'));
}

/**
 * `GET /api/analysis/{public|private}` — the indicators of a riesgo and their metadata.
 * Same path the analysis is POSTed to; the verb tells them apart.
 *
 * TODO(mock-indicators): the mock branch answers the fixture of the riesgo asked and
 * ignores `cultivo`; drop it when the endpoint is reachable (grep `mock-indicators`).
 */
export async function fetchIndicators(params: IndicatorsParams): Promise<Indicators> {
  if (env.VITE_USE_MOCK_API) {
    const fixtures = await import('./fixtures/indicators');

    return indicatorsSchema.parse(
      params.riesgo === 'sanitario'
        ? fixtures.sanitarioIndicatorsFixture
        : fixtures.productivoIndicatorsFixture,
    );
  }

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
