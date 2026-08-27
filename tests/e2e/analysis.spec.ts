import { expect, test, type Page } from '@playwright/test';

import { drawPolygon, mapCanvas, stubBasemap } from './fixtures/map';

// Same canvas-relative coordinates as draw-controls.spec.ts (the canvas is the right
// half of the viewport, ~640px wide).
const FIRST_POLYGON = [
  { x: 300, y: 250 },
  { x: 360, y: 250 },
  { x: 360, y: 350 },
];

const SECOND_POLYGON = [
  { x: 440, y: 450 },
  { x: 500, y: 450 },
  { x: 500, y: 550 },
];

function controls(page: Page) {
  return {
    draw: page.getByRole('button', { name: 'Dibujar polígono' }),
    analyze: page.getByRole('button', { name: 'Analizar' }),
    status: page.getByRole('group', { name: 'Herramientas de dibujo' }).locator('p'),
  };
}

test.beforeEach(async ({ page }) => {
  await stubBasemap(page);
  await page.goto('/');

  await expect(controls(page).draw).toBeEnabled();
  await expect(mapCanvas(page)).toBeVisible();
});

test('analyzes every polygon on the map and ends the drawing session', async ({ page }) => {
  const { draw, analyze, status } = controls(page);

  // Nothing on the map yet: analysis has nothing to send.
  await expect(analyze).toBeDisabled();

  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await drawPolygon(page, SECOND_POLYGON);
  await expect(status).toHaveText('2 áreas dibujadas.');
  await expect(analyze).toBeEnabled();

  await analyze.click();

  // The fake endpoint accepts all polygons — no selection involved.
  await expect(page.getByText('Análisis aceptado: se enviaron 2 áreas.')).toBeVisible();

  // Analyze exits drawing mode; the polygons stay on the map.
  await expect(draw).toHaveAttribute('aria-pressed', 'false');
  await expect(status).toHaveText('2 áreas dibujadas.');

  // Drawing again starts the next session from scratch.
  await draw.click();
  await expect(status).toHaveText('No hay áreas dibujadas.');
  await expect(analyze).toBeDisabled();
});
