import { expect, test, type Page } from '@playwright/test';

import { drawPolygon, mapCanvas, stubBasemap } from './fixtures/map';

// Same canvas-relative coordinates as draw-controls.spec.ts (the canvas is the right
// half of the viewport, ~640px wide).
const FIRST_POLYGON = [
  { x: 300, y: 250 },
  { x: 360, y: 250 },
  { x: 360, y: 350 },
];

/** Inside the first triangle: near its right-angle corner at (360, 250)–(360, 350). */
const INSIDE_FIRST = { x: 345, y: 275 };

const SECOND_POLYGON = [
  { x: 440, y: 450 },
  { x: 500, y: 450 },
  { x: 500, y: 550 },
];

const INSIDE_SECOND = { x: 485, y: 475 };

/** Water, far from both triangles. */
const OUTSIDE_BOTH = { x: 100, y: 620 };

function locators(page: Page) {
  return {
    draw: page.getByRole('button', { name: 'Dibujar polígono' }),
    analyze: page.getByRole('button', { name: 'Analizar' }),
    firstEntry: page.getByRole('button', { name: 'Área dibujada 1' }),
    secondEntry: page.getByRole('button', { name: 'Área dibujada 2' }),
  };
}

test.beforeEach(async ({ page }) => {
  await stubBasemap(page);
  await page.goto('/');

  const { draw } = locators(page);

  await expect(draw).toBeEnabled();
  await expect(mapCanvas(page)).toBeVisible();

  // Two parcels, then park the draw tool: map clicks select only while idle.
  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await drawPolygon(page, SECOND_POLYGON);
  await draw.click();
  await expect(draw).toHaveAttribute('aria-pressed', 'false');
});

test('clicking a parcel on the map selects it for analysis', async ({ page }) => {
  const { firstEntry, secondEntry } = locators(page);

  // Drawing produced no selection: the vertex clicks were draw-mode clicks.
  await expect(firstEntry).toHaveAttribute('aria-pressed', 'false');
  await expect(secondEntry).toHaveAttribute('aria-pressed', 'false');

  await mapCanvas(page).click({ position: INSIDE_FIRST });
  await expect(firstEntry).toHaveAttribute('aria-pressed', 'true');

  // Clicking the other parcel moves the selection: it is single.
  await mapCanvas(page).click({ position: INSIDE_SECOND });
  await expect(secondEntry).toHaveAttribute('aria-pressed', 'true');
  await expect(firstEntry).toHaveAttribute('aria-pressed', 'false');

  // A miss keeps the selection, mirroring the panel, which offers no deselect.
  await mapCanvas(page).click({ position: OUTSIDE_BOTH });
  await expect(secondEntry).toHaveAttribute('aria-pressed', 'true');
});

test('map clicks stop selecting once Analizar is pressed', async ({ page }) => {
  const { analyze, firstEntry, secondEntry } = locators(page);

  await mapCanvas(page).click({ position: INSIDE_FIRST });
  await expect(firstEntry).toHaveAttribute('aria-pressed', 'true');

  await analyze.click();
  await expect(page.getByText('Análisis aceptado: se enviaron 2 áreas.')).toBeVisible();

  // The session is over: clicking the other parcel changes nothing.
  await mapCanvas(page).click({ position: INSIDE_SECOND });
  await expect(firstEntry).toHaveAttribute('aria-pressed', 'true');
  await expect(secondEntry).toHaveAttribute('aria-pressed', 'false');
});
