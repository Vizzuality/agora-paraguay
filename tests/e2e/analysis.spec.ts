import { expect, test, type Page } from '@playwright/test';

import { drawPolygon, mapCanvas, stubBasemap } from './fixtures/map';

// Canvas-relative coordinates (the canvas is the right half of the viewport,
// ~640px wide).
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
    // Tolerant of both labels: the button reads "Cancelar" while a session is armed.
    draw: page.getByRole('button', { name: /Dibujar polígono|Cancelar/ }),
    analyze: page.getByRole('button', { name: 'Analizar' }),
    firstEntry: page.getByRole('button', { name: 'Área dibujada 1' }),
    secondEntry: page.getByRole('button', { name: 'Área dibujada 2' }),
  };
}

test.beforeEach(async ({ page }) => {
  await stubBasemap(page);
  await page.goto('/');

  await expect(controls(page).draw).toBeEnabled();
  await expect(mapCanvas(page)).toBeVisible();
});

test('analyzes every polygon on the map and moves to the analysis page', async ({ page }) => {
  const { draw, analyze, firstEntry, secondEntry } = controls(page);

  // Nothing on the map yet: analysis has nothing to send.
  await expect(analyze).toBeDisabled();

  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await drawPolygon(page, SECOND_POLYGON);
  await expect(secondEntry).toBeVisible();
  await expect(analyze).toBeEnabled();

  // A successful submission navigates to the analysis page.
  await analyze.click();
  await expect(page).toHaveURL(/\/analisis/);
  await expect(page.getByRole('heading', { name: 'Análisis' })).toBeVisible();

  // The submitted areas are listed, read-only, with the same names as the panel list.
  const areas = page.getByRole('list').getByRole('listitem');
  await expect(areas).toHaveText(['Área dibujada 1', 'Área dibujada 2']);

  // Going back remounts the map; the selection survives and is editable again.
  await page.goBack();
  await expect(controls(page).draw).toBeEnabled();
  await expect(firstEntry).toBeVisible();
  await expect(secondEntry).toBeVisible();
  await expect(analyze).toBeEnabled();
});
