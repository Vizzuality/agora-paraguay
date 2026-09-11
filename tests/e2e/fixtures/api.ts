import type { Page } from '@playwright/test';

/**
 * Stubs the endpoints Analizar chains (`analyzeSelection`): indicators, parcel
 * filtering, and the analysis itself. Keeps the specs hermetic — the Django backend is
 * never running under Playwright — while still exercising the real client code, so a
 * body the schemas reject fails the spec.
 *
 * Matched on the exact pathname, never a glob: `**\/api/analysis/**` would also catch
 * Vite serving `/src/lib/api/analysis/client.ts` and break the app's module graph.
 */
export async function stubAnalysisApi(page: Page) {
  await page.route(
    (url) => url.pathname === '/api/indicators/',
    (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'iep',
            name: 'Índice de exposición a plagas',
            unit: '%',
            default: true,
            indicator_type: { type: 'range', min: 0, max: 100, step: '1' },
          },
        ]),
      }),
  );

  await page.route(
    (url) => url.pathname === '/api/parcels/filter_parcels',
    (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: '',
          input: { features: [] },
          results: [
            {
              parcel_id: 8668,
              geometry: { type: 'FeatureCollection', features: [] },
              selected: true,
            },
          ],
        }),
      }),
  );

  await page.route(
    (url) => url.pathname === '/api/analysis/public' || url.pathname === '/api/analysis/private',
    (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          indicators: [{ id: 'iep', category: 'sanitario', value: 70, display_value: '70 %' }],
        }),
      }),
  );
}
