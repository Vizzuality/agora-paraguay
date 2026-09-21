import type { Page } from '@playwright/test';

/** The hero filters as the live API shapes them: a category and two dates, one defaulted. */
export const HERO_FILTERS = [
  {
    id: 'crop_type',
    name: 'Tipo de cultivo',
    description: 'Cultivo a evaluar.',
    field_type: {
      type: 'category',
      options: [
        { value: 'rice', label: 'Arroz' },
        { value: 'soy', label: 'Soja' },
      ],
    },
  },
  {
    id: 'sowing_date',
    name: 'Fecha de siembra',
    field_type: { type: 'date', format: 'YYYY-MM-DD', default: null },
  },
  {
    id: 'date',
    name: 'Fecha',
    field_type: { type: 'date', format: 'YYYY-MM-DD', default: '2026-09-17' },
  },
];

/**
 * The indicator lists the analysis paths answer with no parcels, with the ids the
 * analysis stub has columns for. Ids and names are what the specs look for.
 */
export const SANITARIO_INDICATORS = [
  {
    id: 'crop_type',
    name: 'Tipo de cultivo',
    description: 'Cultivo a evaluar.',
    default: true,
    indicator_type: { type: 'text' },
  },
  {
    id: 'asian_rust',
    name: 'Phakopsora pachyrhizi',
    description: 'Enfermedad favorecida por humedad elevada y altas temperaturas.',
    default: true,
    indicator_type: { type: 'range', min: 1, max: 3, step: 1 },
  },
];

export const PRODUCTIVO_INDICATORS = [
  {
    id: 'Pro_soja',
    name: 'Producción base histórica de soja',
    unit: 't/ha',
    default: true,
    indicator_type: { type: 'numeric' },
  },
];

/**
 * Stubs the endpoints the analysis page chains (`useAnalysis`): parcel
 * filtering, and the analysis itself — plus the filters the /analisis hero lists
 * (`GET /api/parcels/filters/`). Keeps the specs hermetic — the Django backend is
 * never running under Playwright — while still exercising the real client code, so a
 * body the schemas reject fails the spec.
 *
 * Matched on the exact pathname, never a glob: `**\/api/**` would also catch Vite
 * serving `/src/lib/api/analysis/client.ts` and break the app's module graph.
 */
export async function stubAnalysisApi(page: Page) {
  await page.route(
    (url) => url.pathname === '/api/parcels/filters/',
    (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(HERO_FILTERS),
      }),
  );

  await page.route(
    (url) => url.pathname === '/api/parcels/filter-parcels/',
    (route) => {
      // One selected parcel with real-shaped geometry (a MultiPolygon): the bounding box
      // of the first drawn polygon, grown a little, so it paints where the drawing is and
      // the camera fly to the areas keeps it in frame.
      const body = route.request().postDataJSON() as {
        filtering_polygons: { features: { geometry: { coordinates: number[][][] } }[] };
      };
      const ring = body.filtering_polygons.features[0]?.geometry.coordinates[0] ?? [];
      const lngs = ring.map(([lng]) => lng);
      const lats = ring.map(([, lat]) => lat);
      const pad = 0.002;
      const west = Math.min(...lngs) - pad;
      const east = Math.max(...lngs) + pad;
      const south = Math.min(...lats) - pad;
      const north = Math.max(...lats) + pad;

      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: '',
          input: { features: [] },
          results: [
            {
              parcel_id: 'D07D21P00000002',
              geometry: {
                type: 'FeatureCollection',
                features: [
                  {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                      type: 'MultiPolygon',
                      coordinates: [
                        [
                          [
                            [west, south],
                            [east, south],
                            [east, north],
                            [west, north],
                            [west, south],
                          ],
                        ],
                      ],
                    },
                  },
                ],
              },
              selected: true,
            },
          ],
        }),
      });
    },
  );

  // The analysis path answers two requests: the indicator list (`parcel_ids: []`, no
  // parcels) and the analysis run (`parcels` + `indicators`).
  await page.route(
    (url) =>
      url.pathname === '/api/parcels/analysis/diseases/' ||
      url.pathname === '/api/parcels/analysis/production/',
    (route) => {
      const body = route.request().postDataJSON() as { indicators?: string[] };

      if (body.indicators === undefined) {
        return route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify(
            new URL(route.request().url()).pathname.endsWith('/diseases/')
              ? SANITARIO_INDICATORS
              : PRODUCTIVO_INDICATORS,
          ),
        });
      }

      // One parcel, answered with the columns the request asked for and nothing else, the
      // way the backend does: the disease index sits at the top of its 1–3 range, so the
      // card reads "Alto" over "3". Column casing as the backend writes it (`Asian_rust`).
      const { indicators } = body;
      const columns: Record<string, string | number> = { crop_type: 'Soja', Asian_rust: 3 };
      const properties = Object.fromEntries(
        Object.entries(columns).filter(([column]) =>
          indicators.some((id) => id.toLowerCase() === column.toLowerCase()),
        ),
      );

      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: '',
          input: {},
          indicators: [{ parcel_id: 'D07D21P00000002', properties }],
        }),
      });
    },
  );
}

/** What the live API says for an area outside the cadastre, HTTP 200. */
export const OUT_OF_COVERAGE_MESSAGE = 'The submitted area is outside our current coverage.';

/**
 * Overrides the `filter-parcels` stub with the live API's answer for an area outside
 * the cadastre: `status: "empty"`, `results: {}` (an object, not a list). Registered
 * after `stubAnalysisApi`, so Playwright tries it first.
 */
export async function stubUncoveredArea(page: Page) {
  await page.route(
    (url) => url.pathname === '/api/parcels/filter-parcels/',
    (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'empty',
          message: OUT_OF_COVERAGE_MESSAGE,
          input: { features: [] },
          results: {},
        }),
      }),
  );
}
