import { expect, test, type Page } from '@playwright/test';

import { drawPolygon, mapCanvas, stubBasemap } from './fixtures/map';

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
});

test('cancelling an armed session stays on step 1', async ({ page }) => {
  const { draw, currentStep } = controls(page);

  await draw.click();
  await draw.click();

  await expect(draw).toHaveAccessibleName('Dibujar polígono');
  await expect(draw).toHaveAttribute('aria-pressed', 'false');
  await expect(currentStep).toContainText('Paso 1');
});

// Reiniciar starts over: whatever is on the map goes and the entry points come back.
test('Reiniciar clears the drawing and returns to step 1', async ({ page }) => {
  const { draw, analyze, restart, currentStep } = controls(page);

  await draw.click();
  await drawPolygon(page, POLYGON);
  await expect(analyze).toBeEnabled();

  await restart.click();

  await expect(currentStep).toContainText('Paso 1');
  await expect(analyze).toBeHidden();
  await expect(draw).toHaveAccessibleName('Dibujar polígono');

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
