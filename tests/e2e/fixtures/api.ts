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
    (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: '',
          input: { features: [] },
          results: [
            {
              parcel_id: 'D07D21P00000002',
              geometry: { type: 'FeatureCollection', features: [] },
              selected: true,
            },
          ],
        }),
      }),
  );

  // The analysis run. The indicator list has no endpoint yet (the app serves its fixture,
  // whose ids match the columns below), so only the POST is stubbed.
  await page.route(
    (url) =>
      url.pathname === '/api/parcels/analysis/diseases/' ||
      url.pathname === '/api/parcels/analysis/production/',
    (route) => {
      // One parcel, answered with the columns the request asked for and nothing else, the
      // way the backend does: the disease index sits at the top of its 1–3 range, so the
      // card reads "Alto" over "3". Column casing as the backend writes it (`Asian_rust`).
      const { indicators } = route.request().postDataJSON() as { indicators: string[] };
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
