import { getJson } from '@/lib/api/http';

import {
  filtersSchema,
  indicatorsSchema,
  type Filters,
  type FiltersParams,
  type Indicators,
  type IndicatorsParams,
} from './schemas';

/*
 * The only module in `metadata/` that knows which data is fake. Filters are real; the
 * indicators have no endpoint yet and serve their fixture.
 */

/**
 * `GET /api/parcels/filters/?visibility={public|private}` — the filters of that side of
 * the analysis and their values.
 */
export async function fetchFilters(params: FiltersParams): Promise<Filters> {
  return filtersSchema.parse(await getJson('/api/parcels/filters/', params));
}

/**
 * The indicators of a riesgo and their metadata.
 *
 * TODO(mock-indicators): no list endpoint exists yet — `GET` on the analysis paths answers
 * 405 (checked 2026-09-18), so this serves the fixture of the riesgo asked, ignoring
 * `cultivo`. Wire the real call here when the backend names it (grep
 * `mock-indicators`); nothing else changes, Analizar already chains through this.
 */
export async function fetchIndicators(params: IndicatorsParams): Promise<Indicators> {
  const fixtures = await import('./fixtures/indicators');

  return indicatorsSchema.parse(
    params.riesgo === 'sanitario'
      ? fixtures.sanitarioIndicatorsFixture
      : fixtures.productivoIndicatorsFixture,
  );
}
