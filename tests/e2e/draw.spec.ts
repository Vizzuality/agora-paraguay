import { expect, test, type Page } from '@playwright/test';

import { drawPolygon, mapCanvas, stubBasemap } from './fixtures/map';

// Positions are relative to the canvas, which is the right half of the 1280×720
// viewport (~640px wide) — the sidebar has the left half.
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
    firstEntry: page.getByRole('button', { name: 'Área dibujada 1' }),
    secondEntry: page.getByRole('button', { name: 'Área dibujada 2' }),
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

test('draws several polygons without leaving draw mode', async ({ page }) => {
  const { draw, firstEntry, secondEntry } = controls(page);

  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await expect(firstEntry).toBeVisible();

  // Still armed: the second polygon needs no trip back to the panel. While armed the
  // button reads "Cancelar" (Figma node 5145:4038).
  await expect(draw).toHaveAttribute('aria-pressed', 'true');
  await expect(draw).toHaveAccessibleName('Cancelar');
  await drawPolygon(page, SECOND_POLYGON);
  await expect(secondEntry).toBeVisible();
});

// Activating the draw tool starts a session from scratch: whatever was on the map goes.
test('reactivating draw clears the previous session', async ({ page }) => {
  const { draw, firstEntry } = controls(page);

  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await expect(firstEntry).toBeVisible();

  // Toggling off keeps the polygon; toggling back on clears it.
  await draw.click();
  await expect(firstEntry).toBeVisible();

  await draw.click();
  await expect(draw).toHaveAttribute('aria-pressed', 'true');
  await expect(firstEntry).toBeHidden();
});

// The geometry is in-memory global state by design: only the camera is persisted, and it
// lives in the URL.
test('loses the drawing on reload', async ({ page }) => {
  const { draw, firstEntry } = controls(page);

  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await expect(firstEntry).toBeVisible();

  await page.reload();

  await expect(controls(page).draw).toBeEnabled();
  await expect(controls(page).firstEntry).toBeHidden();
});
