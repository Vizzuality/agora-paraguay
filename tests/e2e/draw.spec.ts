import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test, type Page } from '@playwright/test';

import { OUT_OF_COVERAGE_MESSAGE, stubAnalysisApi, stubUncoveredArea } from './fixtures/api';
import { drawPolygon, mapCanvas, stubBasemap, yellowPixelCount } from './fixtures/map';

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
    // Step 2 only: Analizar appearing is the observable signal that an area landed.
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
  await page.goto('/');

  // Terra Draw starts on the style's `load` event, and the Draw button is disabled until
  // it has: waiting on that is what makes the rest of the spec deterministic.
  await expect(controls(page).draw).toBeEnabled();
  await expect(mapCanvas(page)).toBeVisible();
});

// One área de interés per session: closing the polygon parks the tool and the panel
// moves on to confirmation (Figma 7172:1771).
test('finishing a polygon leaves draw mode and moves to step 2', async ({ page }) => {
  const { draw, analyze, currentStep } = controls(page);

  await expect(currentStep).toContainText('Paso 1');
  await expect(analyze).toBeHidden();

  await draw.click();
  // While armed the button reads "Cancelar" (Figma 7172:1997).
  await expect(draw).toHaveAttribute('aria-pressed', 'true');
  await expect(draw).toHaveAccessibleName('Cancelar');
  await expect(page.getByText('Haga clic para comenzar el polígono')).toBeVisible();

  await drawPolygon(page, POLYGON);

  await expect(currentStep).toContainText('Paso 2');
  await expect(analyze).toBeEnabled();
  await expect(draw).toBeHidden();

  // The camera flies to the new area: the first camera write of the session, with a
  // zoom closer than the country-wide default (5.5).
  await expect
    .poll(() => Number(new URL(page.url()).searchParams.get('zoom')))
    .toBeGreaterThan(5.5);
});

test('cancelling an armed session stays on step 1', async ({ page }) => {
  const { draw, currentStep } = controls(page);

  await draw.click();
  await draw.click();

  await expect(draw).toHaveAccessibleName('Dibujar polígono');
  await expect(draw).toHaveAttribute('aria-pressed', 'false');
  await expect(currentStep).toContainText('Paso 1');
});

// Reiniciar starts over: whatever is on the map goes, the entry points come back and the
// camera returns to the opening view.
test('Reiniciar clears the drawing and returns to step 1', async ({ page }) => {
  const { draw, analyze, restart, currentStep } = controls(page);

  await draw.click();
  await drawPolygon(page, POLYGON);
  await expect(analyze).toBeEnabled();

  // The finished drawing eased the camera onto it: the URL holds a closer zoom. And the
  // (stubbed) parcels painted over it.
  await expect
    .poll(() => Number(new URL(page.url()).searchParams.get('zoom')), { timeout: 5_000 })
    .toBeGreaterThan(5.5);
  await expect.poll(() => yellowPixelCount(page), { timeout: 10_000 }).toBeGreaterThan(200);

  await restart.click();

  await expect(currentStep).toContainText('Paso 1');
  await expect(analyze).toBeHidden();
  await expect(draw).toHaveAccessibleName('Dibujar polígono');

  // The parcels go with the drawing: nothing stays painted from the previous answer.
  await expect.poll(() => yellowPixelCount(page), { timeout: 10_000 }).toBe(0);

  // Back to the opening view (`INITIAL_VIEW_STATE`), written to the URL by `moveend`.
  await expect
    .poll(() => Object.fromEntries(new URL(page.url()).searchParams), { timeout: 5_000 })
    .toEqual({ lng: '-58.44', lat: '-23.44', zoom: '5.5' });

  // A fresh session works exactly like the first one.
  await draw.click();
  await drawPolygon(page, POLYGON);
  await expect(analyze).toBeEnabled();
});

// The geometry is in-memory global state by design: only the camera is persisted, and it
// lives in the URL.
test('loses the drawing on reload', async ({ page }) => {
  const { draw, analyze } = controls(page);

  await draw.click();
  await drawPolygon(page, POLYGON);
  await expect(analyze).toBeEnabled();

  await page.reload();

  await expect(controls(page).draw).toBeEnabled();
  await expect(controls(page).analyze).toBeHidden();
});

// The cadastre does not cover the drawn area: the API answers `empty` (HTTP 200) and the
// drawing is rejected — back to step 1 with the reason in the error toast (Figma
// 7288:2099) and the entry point that made it outlined (7288:2096) until dismissed.
test('a drawing outside the cadastre is rejected back to step 1 with the reason', async ({
  page,
}) => {
  const { draw, analyze, currentStep } = controls(page);
  const notice = page.getByRole('region', { name: 'Aviso de área' });

  await stubUncoveredArea(page);

  await draw.click();
  await drawPolygon(page, POLYGON);

  await expect(currentStep).toContainText('Paso 1');
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

// Starting over from a rejection clears it: the next entry point must not inherit the
// previous areas' verdict, and its own answer decides.
test('a rejected drawing does not taint the upload that follows', async ({ page }) => {
  const { draw, analyze, upload } = controls(page);
  const notice = page.getByRole('region', { name: 'Aviso de área' });

  // Only the drawing is outside coverage: the first `filter-parcels` answers empty, the
  // upload's request falls through to the regular stub.
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
