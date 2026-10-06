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
 * The indicator lists `GET /api/parcels/indicators?riesgo={sanitario|productivo}` answers, with the ids the
 * analysis stub has columns for. Ids and names are what the specs look for.
 */
/** The parcel area, answered as one more column; the thumbnail prints it, never a card. */
const AREA_INDICATOR = {
  id: 'area',
  name: 'Área',
  unit: 'ha',
  indicator_type: { type: 'numeric' },
};

/** West 10.2 ha + east 7.3 ha: 17.5 ha under Todas. */
export const PARCEL_AREAS: Record<string, number> = { D07D21P00000002: 10.2, D07D23P00000008: 7.3 };

/** Base soy production per parcel (t/ha), for the productivo values widget: west, then east. */
export const PARCEL_PRODUCTION: Record<string, number> = {
  D07D21P00000002: 3.55,
  D07D23P00000008: 3.81,
};

/** Deviation from the base per parcel (t/ha): west above it, east below, for the diverging widget. */
export const PARCEL_DEVIATION: Record<string, number> = {
  D07D21P00000002: 0.5,
  D07D23P00000008: -0.3,
};

export const SANITARIO_INDICATORS = [
  // The backend echoes the crop filter into the list as is — a filter, not an indicator.
  HERO_FILTERS[0],
  AREA_INDICATOR,
  {
    id: 'asian_rust',
    name: 'Phakopsora pachyrhizi',
    // A filter reference as the live API writes it: shown as the filter's current value.
    description:
      "Enfermedad favorecida por humedad elevada y altas temperaturas en las 72 horas previas a {'id': 'date'}.",
    default: true,
    indicator_type: { type: 'range', min: 1, max: 3, step: 1 },
  },
];

/** The two parcels `filter-parcels` answers for any drawing: west half, east half. */
export const WEST_PARCEL_ID = 'D07D21P00000002';
export const EAST_PARCEL_ID = 'D07D23P00000008';

// No area here, as in the live list: the thumbnail reads it from the sanitario analysis.
export const PRODUCTIVO_INDICATORS = [
  {
    id: 'Resiliencia',
    name: 'Proxy de resiliencia operativa',
    unit: null,
    default: true,
    indicator_type: { type: 'category', categories: ['Alta', 'Media', 'Baja'] },
  },
  {
    id: 'Pro_arroz',
    name: 'Producción base histórica de arroz',
    unit: 't/ha',
    default: true,
    indicator_type: { type: 'numeric' },
  },
  // Typed `numeric` as the live list does; the client retypes it by its id (`Des_`).
  {
    id: 'Des_soja',
    name: 'Desviación de la producción de soja respecto a la base histórica',
    unit: 't/ha',
    default: true,
    indicator_type: { type: 'numeric' },
  },
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
 * filtering, the indicator list and the analysis itself — plus the filters the /analisis
 * hero lists (`GET /api/parcels/filters/`). Keeps the specs hermetic — the Django backend is
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
      // Two selected parcels with real-shaped geometry (MultiPolygons): the bounding box
      // of the first drawn polygon, grown a little, split down the middle into a west and
      // an east half. They paint where the drawing is, the camera fly to the areas keeps
      // them in frame, and the analysis page has two tabs to switch between.
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
      const middle = (west + east) / 2;

      const parcel = (parcelId: string, left: number, right: number) => ({
        parcel_id: parcelId,
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
                      [left, south],
                      [right, south],
                      [right, north],
                      [left, north],
                      [left, south],
                    ],
                  ],
                ],
              },
            },
          ],
        },
        selected: true,
      });

      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: '',
          input: { features: [] },
          results: [parcel(WEST_PARCEL_ID, west, middle), parcel(EAST_PARCEL_ID, middle, east)],
        }),
      });
    },
  );

  // The indicator list of the riesgo asked for in the query string.
  await page.route(
    (url) => url.pathname === '/api/parcels/indicators',
    (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(
          new URL(route.request().url()).searchParams.get('riesgo') === 'productivo'
            ? PRODUCTIVO_INDICATORS
            : SANITARIO_INDICATORS,
        ),
      }),
  );

  // The AI summary answers Markdown, not JSON. Echoes the parcels it was asked about,
  // so a spec can tell the request carried the analysed selection.
  await page.route(
    (url) => url.pathname === '/api/parcels/analysis/summary/',
    (route) => {
      const { parcels } = route.request().postDataJSON() as { parcels: string[] };

      return route.fulfill({
        contentType: 'text/markdown',
        body: `## Resumen de ${parcels.length} parcelas\n\n- ${parcels.join('\n- ')}`,
      });
    },
  );

  // The analysis run (`parcels` + `indicators`).
  await page.route(
    (url) =>
      url.pathname === '/api/parcels/analysis/diseases/' ||
      url.pathname === '/api/parcels/analysis/production/',
    (route) => {
      // Both parcels, answered with the columns the request asked for and nothing else,
      // the way the backend does. The west parcel's disease index sits at the top of its
      // 1–3 range (card reads "Severo"), the east one's at the bottom ("Sin riesgo"), so
      // the specs can tell which tab is open. Column casing as the backend writes it
      // (`Asian_rust`).
      const { indicators } = route.request().postDataJSON() as { indicators: string[] };
      const answer = (parcelId: string, rust: number) => {
        const columns: Record<string, string | number> = {
          crop_type: 'Soja',
          area: PARCEL_AREAS[parcelId],
          Asian_rust: rust,
          Pro_soja: PARCEL_PRODUCTION[parcelId],
          Des_soja: PARCEL_DEVIATION[parcelId],
          // The selection is soy: the arroz indicator does not apply, the backend says NA.
          Pro_arroz: 'NA',
          // Both parcels Media: the resilience widget counts 2 under Media.
          Resiliencia: 'Media',
        };

        return {
          parcel_id: parcelId,
          properties: Object.fromEntries(
            Object.entries(columns).filter(([column]) =>
              indicators.some((id) => id.toLowerCase() === column.toLowerCase()),
            ),
          ),
        };
      };

      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: '',
          input: {},
          indicators: [answer(WEST_PARCEL_ID, 3), answer(EAST_PARCEL_ID, 1)],
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
