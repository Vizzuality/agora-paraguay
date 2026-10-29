import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test, type Page } from '@playwright/test';

import { INITIAL_VIEW_STATE } from '../../src/lib/map/view-state';
import { OUT_OF_COVERAGE_MESSAGE, stubAnalysisApi, stubUncoveredArea } from './fixtures/api';
import {
  cameraParams,
  COUNTRY_SCALE_URL,
  drawPolygon,
  FARM_SCALE_URL,
  mapCanvas,
  OPENING_ZOOM,
  stubBasemap,
  yellowPixelCount,
  zoomToFarmScale,
} from './fixtures/map';
import { savedPolygonCount } from './fixtures/saved-selection';
import { pickAnalysisType } from './fixtures/selection';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'uploads');

// Positions are relative to the canvas, which is the right half of the 1280×720
// viewport (~640px wide) — the sidebar has the left half.
const POLYGON = [
  { x: 300, y: 250 },
  { x: 360, y: 250 },
  { x: 360, y: 350 },
];

function controls(page: Page) {
  return {
    // Tolerant of both labels: the button reads "Cancelar" while a session is armed.
    draw: page.getByRole('button', { name: /Dibujar polígono|Cancelar/ }),
    upload: page.getByRole('button', { name: 'Subir archivo' }),
    // Step 3 only: Analizar appearing is the observable signal that an area landed.
    analyze: page.getByRole('button', { name: 'Analizar' }),
    restart: page.getByRole('button', { name: 'Reiniciar' }),
    currentStep: page
      .getByRole('list', { name: 'Pasos de la selección' })
      .locator('[aria-current="step"]'),
  };
}

test.beforeEach(async ({ page }) => {
  await stubBasemap(page);
  await stubAnalysisApi(page);
  // Zoomed in to farm scale: at the opening zoom the test triangle covers a department,
  // over the area limit (see 'a drawing over the area limit').
  await page.goto(FARM_SCALE_URL);
  await pickAnalysisType(page);

  // Terra Draw starts on the style's `load` event, and the Draw button is disabled until
  // it has: waiting on that is what makes the rest of the spec deterministic.
  await expect(controls(page).draw).toBeEnabled();
  await expect(mapCanvas(page)).toBeVisible();
});

// One área de interés per session: closing the polygon parks the tool and the panel
// moves on to confirmation.
test('finishing a polygon leaves draw mode and moves to step 3', async ({ page }) => {
  const { draw, analyze, currentStep } = controls(page);

  await expect(currentStep).toContainText('Paso 2');
  await expect(analyze).toBeHidden();

  await draw.click();
  // While armed the button reads "Cancelar".
  await expect(draw).toHaveAttribute('aria-pressed', 'true');
  await expect(draw).toHaveAccessibleName('Cancelar');
  await expect(page.getByText('Haga clic para comenzar el polígono')).toBeVisible();

  await drawPolygon(page, POLYGON);

  await expect(currentStep).toContainText('Paso 3');
  await expect(analyze).toBeEnabled();
  await expect(draw).toBeHidden();

  // The camera flies to the new area: the first camera write of the session, with a
  // zoom closer than the opening view's.
  await expect
    .poll(() => Number(new URL(page.url()).searchParams.get('zoom')))
    .toBeGreaterThan(OPENING_ZOOM);
});

// The analysis type is picked first (Paso 1); Paso 2 offers Reiniciar to change it.
test('Reiniciar on step 2 returns to the analysis type', async ({ page }) => {
  const { draw, upload, restart, currentStep } = controls(page);

  await expect(currentStep).toContainText('Paso 2');
  await restart.click();

  await expect(currentStep).toContainText('Paso 1');
  await expect(draw).toBeHidden();
  await expect(upload).toBeHidden();

  await pickAnalysisType(page, 'Riesgo productivo');
  await expect(currentStep).toContainText('Paso 2');
  await expect(draw).toBeEnabled();
});

test('cancelling an armed session stays on step 2', async ({ page }) => {
  const { draw, currentStep } = controls(page);

  await draw.click();
  await draw.click();

  await expect(draw).toHaveAccessibleName('Dibujar polígono');
  await expect(draw).toHaveAttribute('aria-pressed', 'false');
  await expect(currentStep).toContainText('Paso 2');
});

// Reiniciar starts over: whatever is on the map goes, the panel is back on the analysis
// type and the camera returns to the opening view.
test('Reiniciar clears the drawing and returns to step 1', async ({ page }) => {
  const { draw, analyze, restart, currentStep } = controls(page);

  await draw.click();
  await drawPolygon(page, POLYGON);
  await expect(analyze).toBeEnabled();

  // The finished drawing eased the camera onto it: the URL holds a closer zoom. And the
  // (stubbed) parcels painted over it.
  await expect
    .poll(() => Number(new URL(page.url()).searchParams.get('zoom')), { timeout: 5_000 })
    .toBeGreaterThan(OPENING_ZOOM);
  await expect.poll(() => yellowPixelCount(page), { timeout: 10_000 }).toBeGreaterThan(200);

  await restart.click();

  await expect(currentStep).toContainText('Paso 1');
  await expect(analyze).toBeHidden();
  await expect(draw).toBeHidden();

  // The parcels go with the drawing: nothing stays painted from the previous answer.
  await expect.poll(() => yellowPixelCount(page), { timeout: 10_000 }).toBe(0);

  // Back to the opening view (`INITIAL_VIEW_STATE`), written to the URL by `moveend`.
  await expect
    .poll(() => Object.fromEntries(new URL(page.url()).searchParams), { timeout: 5_000 })
    .toEqual(cameraParams(INITIAL_VIEW_STATE));

  // A fresh session works exactly like the first one (zoomed in again: the opening view
  // makes the test triangle a department, over the area limit).
  await zoomToFarmScale(page);
  await pickAnalysisType(page);
  await draw.click();
  await drawPolygon(page, POLYGON);
  await expect(analyze).toBeEnabled();
});

// The drawing is saved on disk as it changes and restored when the page comes back:
// the panel is on step 3 again, with the parcels for the same area.
test('keeps the drawing across a reload', async ({ page }) => {
  const { draw, analyze, currentStep } = controls(page);

  await draw.click();
  await drawPolygon(page, POLYGON);
  await expect(analyze).toBeEnabled();
  await expect.poll(() => savedPolygonCount(page)).toBeGreaterThan(0);

  await page.reload();

  await expect(currentStep).toContainText('Paso 3');
  await expect(controls(page).analyze).toBeEnabled();
  await expect(controls(page).draw).toBeHidden();
});

// The cadastre does not cover the drawn area: the API answers `empty` (HTTP 200) and the
// drawing is rejected — back to step 2 with the reason in the error toast and the entry
// point that made it outlined until dismissed.
test('a drawing outside the cadastre is rejected back to step 2 with the reason', async ({
  page,
}) => {
  const { draw, analyze, currentStep } = controls(page);
  const notice = page.getByRole('region', { name: 'Aviso de área' });

  await stubUncoveredArea(page);

  await draw.click();
  await drawPolygon(page, POLYGON);

  await expect(currentStep).toContainText('Paso 2');
  await expect(analyze).toBeHidden();
  await expect(notice).toContainText('Ha habido un error.');
  await expect(notice).toContainText(OUT_OF_COVERAGE_MESSAGE);

  // Token-anchored: `ActionCardButton` paints its border from the variant, and the
  // rejection swaps it for the destructive one.
  await expect(draw).toHaveAccessibleName('Dibujar polígono');
  await expect(draw).toHaveClass(/(^| )border-destructive( |$)/);

  await notice.getByRole('button', { name: 'Descartar el aviso de área' }).click();
  await expect(notice).toBeHidden();
  await expect(draw).not.toHaveClass(/(^| )border-destructive( |$)/);
});

/** Only the first areas are outside coverage: later `filter-parcels` calls fall through to the regular stub. */
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

// Starting over from a rejection clears it: the next entry point must not inherit the
// previous areas' verdict, and its own answer decides.
test('a rejected drawing does not taint the upload that follows', async ({ page }) => {
  const { draw, analyze, upload } = controls(page);
  const notice = page.getByRole('region', { name: 'Aviso de área' });

  await stubFirstAreasUncovered(page);

  await draw.click();
  await drawPolygon(page, POLYGON);
  await expect(notice).toContainText(OUT_OF_COVERAGE_MESSAGE);

  // Pressing Subir archivo already dismisses the notice, before any file is picked.
  await upload.click();
  await expect(notice).toBeHidden();

  await page.locator('input[type="file"]').setInputFiles(join(FIXTURES, 'farms.geojson'));
  await expect(analyze).toBeEnabled();
  await expect(notice).toBeHidden();
  await expect(page.getByRole('status', { name: 'Estado de la selección' })).toContainText(
    'Se importaron 3 áreas de farms.geojson.',
  );
});

// After a rejected drawing the next move is to draw again: a click on the map dismisses
// the error and is the first vertex of the new polygon, so two more clicks close it.
test('a click on the map after a rejected drawing starts the next one there', async ({ page }) => {
  const { draw, analyze, currentStep } = controls(page);
  const notice = page.getByRole('region', { name: 'Aviso de área' });

  await stubFirstAreasUncovered(page);

  await draw.click();
  await drawPolygon(page, POLYGON);
  await expect(notice).toContainText(OUT_OF_COVERAGE_MESSAGE);

  const [first, ...rest] = POLYGON;
  await mapCanvas(page).click({ position: first });

  await expect(notice).toBeHidden();
  await expect(draw).toHaveAccessibleName('Cancelar');
  await expect(draw).not.toHaveClass(/(^| )border-destructive( |$)/);

  // Two more vertices close it: the first came from the click that dismissed the error.
  await drawPolygon(page, rest);

  await expect(currentStep).toContainText('Paso 3');
  await expect(analyze).toBeEnabled();
});

// A rejected upload is not a drawing: the map click does not dismiss its error.
test('a click on the map leaves the error of a rejected upload', async ({ page }) => {
  const { upload } = controls(page);
  const notice = page.getByRole('region', { name: 'Aviso de área' });

  await stubUncoveredArea(page);

  await page.locator('input[type="file"]').setInputFiles(join(FIXTURES, 'farms.geojson'));
  await expect(notice).toContainText(OUT_OF_COVERAGE_MESSAGE);

  await mapCanvas(page).click({ position: POLYGON[0] });

  await expect(notice).toContainText(OUT_OF_COVERAGE_MESSAGE);
  await expect(upload).toHaveClass(/(^| )border-destructive( |$)/);
});

// The areas are measured before anything is asked: with the whole country in view the
// test triangle covers hundreds of thousands of hectares, over the limit, and is
// rejected the way an out-of-coverage answer is — but `filter-parcels` never runs.
test('a drawing over the area limit is rejected back to step 2 without asking the API', async ({
  page,
}) => {
  const { draw, analyze, currentStep } = controls(page);
  const notice = page.getByRole('region', { name: 'Aviso de área' });

  let requests = 0;
  await page.route(
    (url) => url.pathname === '/api/parcels/filter-parcels/',
    (route) => {
      requests += 1;

      return route.fallback();
    },
  );

  await page.goto(COUNTRY_SCALE_URL);
  await pickAnalysisType(page);
  await expect(draw).toBeEnabled();
  await expect(mapCanvas(page)).toBeVisible();

  await draw.click();
  await drawPolygon(page, POLYGON);

  await expect(currentStep).toContainText('Paso 2');
  await expect(analyze).toBeHidden();
  await expect(notice).toContainText('Ha habido un error.');
  await expect(notice).toContainText(/supera el máximo de 200\.000 ha/);
  await expect(draw).toHaveClass(/(^| )border-destructive( |$)/);
  expect(requests).toBe(0);

  // Dismissed, the next drawing starts clean.
  await notice.getByRole('button', { name: 'Descartar el aviso de área' }).click();
  await expect(notice).toBeHidden();
});
