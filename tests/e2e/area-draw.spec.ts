import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test, type Page } from '@playwright/test';

import { PARAGUAY_VIEW_STATE } from '../../src/lib/map/view-state';
import { OUT_OF_COVERAGE_MESSAGE, stubAnalysisApi, stubUncoveredArea } from './fixtures/api';
import { cameraUrl, drawPolygon, mapCanvas, stubBasemap } from './fixtures/map';
import { savedPolygonCount } from './fixtures/saved-selection';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'uploads');

// Canvas-relative, inside the content column's map.
const POLYGON = [
  { x: 300, y: 250 },
  { x: 360, y: 250 },
  { x: 360, y: 350 },
];

function controls(page: Page) {
  const area = page.getByRole('region', { name: 'Área de interés' });

  return {
    // Tolerant of both labels: the card reads "Borrar mapa" while drawing.
    draw: area.getByRole('button', { name: /Dibujar polígono|Borrar mapa/ }),
    upload: area.getByRole('button', { name: 'Subir archivo' }),
    input: area.locator('input[type="file"]'),
    analyze: area.getByRole('button', { name: 'Analizar' }),
    notice: page.getByRole('region', { name: 'Aviso de área' }),
  };
}

async function open(page: Page, zoom: number) {
  await page.goto(cameraUrl({ ...PARAGUAY_VIEW_STATE, zoom }, '/analisis/sanitario'));
  await expect(controls(page).draw).toBeEnabled();
  await expect(mapCanvas(page)).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await stubBasemap(page);
  await stubAnalysisApi(page);
});

test('keeps the drawing across a reload', async ({ page }) => {
  await open(page, 12);
  const { draw, analyze } = controls(page);

  await draw.click();
  await drawPolygon(page, POLYGON);
  await expect(analyze).toBeEnabled();
  await expect.poll(() => savedPolygonCount(page)).toBeGreaterThan(0);

  await page.reload();
  await expect(controls(page).analyze).toBeEnabled();
});

// The cadastre does not cover the drawn area: the API answers `empty` (HTTP 200) and the
// drawing is rejected with the reason until dismissed.
test('a drawing outside the cadastre is rejected with the reason', async ({ page }) => {
  await stubUncoveredArea(page);
  await open(page, 12);
  const { draw, analyze, notice } = controls(page);

  await draw.click();
  await drawPolygon(page, POLYGON);

  await expect(analyze).toBeHidden();
  await expect(notice).toContainText('Ha habido un error.');
  await expect(notice).toContainText(OUT_OF_COVERAGE_MESSAGE);

  await notice.getByRole('button', { name: 'Descartar el aviso de área' }).click();
  await expect(notice).toBeHidden();
});

/** Only the first areas are outside coverage: later calls fall through to the regular stub. */
async function stubFirstAreasUncovered(page: Page) {
  let requests = 0;
  await page.route(
    (url) => url.pathname === '/api/parcels/filter-parcels/',
    async (route) => {
      requests += 1;
      if (requests > 1) return route.fallback();

      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'empty',
          message: OUT_OF_COVERAGE_MESSAGE,
          input: { features: [] },
          results: {},
        }),
      });
    },
  );
}

// The next entry point must not inherit the previous areas' verdict.
test('a rejected drawing does not taint the upload that follows', async ({ page }) => {
  await stubFirstAreasUncovered(page);
  await open(page, 12);
  const { draw, upload, input, analyze, notice } = controls(page);

  await draw.click();
  await drawPolygon(page, POLYGON);
  await expect(notice).toContainText(OUT_OF_COVERAGE_MESSAGE);

  // Pressing Subir archivo already dismisses the notice, before any file is picked.
  await upload.click();
  await expect(notice).toBeHidden();

  await input.setInputFiles(join(FIXTURES, 'farms.geojson'));
  await expect(analyze).toBeEnabled();
  await expect(notice).toBeHidden();
});

// A rejected upload is not a drawing: a map click does not dismiss its error.
test('a click on the map leaves the error of a rejected upload', async ({ page }) => {
  await stubUncoveredArea(page);
  await open(page, 12);
  const { input, notice } = controls(page);

  await input.setInputFiles(join(FIXTURES, 'farms.geojson'));
  await expect(notice).toContainText(OUT_OF_COVERAGE_MESSAGE);

  await mapCanvas(page).click({ position: POLYGON[0] });
  await expect(notice).toContainText(OUT_OF_COVERAGE_MESSAGE);
});

// With the whole country in view the test triangle covers hundreds of thousands of
// hectares: rejected as an out-of-coverage answer is, but `filter-parcels` never runs.
test('a drawing over the area limit is rejected without asking the API', async ({ page }) => {
  let requests = 0;
  await page.route(
    (url) => url.pathname === '/api/parcels/filter-parcels/',
    (route) => {
      requests += 1;

      return route.fallback();
    },
  );

  await open(page, PARAGUAY_VIEW_STATE.zoom);
  const { draw, analyze, notice } = controls(page);

  await draw.click();
  await drawPolygon(page, POLYGON);

  await expect(analyze).toBeHidden();
  await expect(notice).toContainText('Ha habido un error.');
  await expect(notice).toContainText(/supera el máximo de 200\.000 ha/);
  expect(requests).toBe(0);
});
