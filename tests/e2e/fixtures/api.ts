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
            id: 'crop_type',
            name: 'Tipo de cultivo',
            default: true,
            indicator_type: { type: 'text' },
          },
          {
            id: 'asian_rust',
            name: 'Phakopsora pachyrhizi',
            default: true,
            indicator_type: { type: 'range', min: 1, max: 3, step: 1 },
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
        // One analysed parcel per submitted area, its disease index at the top of the 1–3
        // range: the first tab's card reads "Alto" over the value "3" — the same reading
        // the shipped fixture gives, so the spec passes with `VITE_USE_MOCK_API` on or off.
        body: JSON.stringify({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {
                fid: 0,
                parcela_id: 'D07D21P00000001',
                crop_type: 'Soja',
                asian_rust: 3,
              },
              geometry: { type: 'MultiPolygon', coordinates: [] },
            },
          ],
        }),
      }),
  );
}
