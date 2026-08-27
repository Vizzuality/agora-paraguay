import { expect, test, type Page } from '@playwright/test';

import { drawPolygon, mapCanvas, stubBasemap } from './fixtures/map';

/**
 * Canvas positions likely to hit the mock cadastral cluster (the fixture is seeded and
 * the camera is fixed, so the cluster is stable, but individual parcel outlines are
 * generator detail — probing keeps the spec decoupled from them).
 */
const PROBE_POSITIONS = [
  { x: 320, y: 360 },
  { x: 300, y: 340 },
  { x: 340, y: 380 },
  { x: 300, y: 390 },
  { x: 350, y: 330 },
  { x: 280, y: 360 },
];

function locators(page: Page) {
  return {
    // Tolerant of both labels: the button reads "Cancelar" while a session is armed.
    draw: page.getByRole('button', { name: /Dibujar polígono|Cancelar/ }),
    analyze: page.getByRole('button', { name: 'Analizar' }),
  };
}

/** Clear of the parcel cluster; from `draw.spec.ts`. */
const DRAWN_POLYGON = [
  { x: 440, y: 450 },
  { x: 500, y: 450 },
  { x: 500, y: 550 },
];

/** Clicks probe positions until one selects a parcel (Analizar arms), returns it. */
async function clickAParcel(page: Page) {
  const { analyze } = locators(page);

  for (const position of PROBE_POSITIONS) {
    await mapCanvas(page).click({ position });

    try {
      await expect(analyze).toBeEnabled({ timeout: 700 });

      return position;
    } catch {
      // Missed the cluster (a road gap or empty slot) — try the next position.
    }
  }

  throw new Error('No probe position hit a cadastral parcel');
}

test.beforeEach(async ({ page }) => {
  await stubBasemap(page);
  await page.goto('/');

  // The draw button arming is the signal that Terra Draw is bound, which also gates
  // the parcel clicks.
  await expect(locators(page).draw).toBeEnabled();
  await expect(mapCanvas(page)).toBeVisible();
});

test('clicking cadastral parcels selects until Analizar submits them', async ({ page }) => {
  const { analyze } = locators(page);

  // Nothing drawn and nothing selected: analysis has nothing to send.
  await expect(analyze).toBeDisabled();

  const position = await clickAParcel(page);

  // A second click on the same parcel toggles it back off…
  await mapCanvas(page).click({ position });
  await expect(analyze).toBeDisabled();

  // …and a third selects it again.
  await mapCanvas(page).click({ position });
  await expect(analyze).toBeEnabled();

  // A successful submission ends the session by navigating to the analysis page.
  await analyze.click();
  await expect(page).toHaveURL(/\/analisis/);

  // The selected parcels survive the trip: going back re-arms Analizar immediately.
  await page.goBack();
  await expect(analyze).toBeEnabled();
});

// Clicking a parcel focuses the selection on cadastral parcels: replace semantics,
// like drawing and uploading, so whatever was drawn or uploaded goes.
test('clicking a parcel clears the drawn polygons', async ({ page }) => {
  const { draw } = locators(page);
  const drawnEntry = page.getByRole('button', { name: 'Área dibujada 1' });

  await draw.click();
  await drawPolygon(page, DRAWN_POLYGON);
  await expect(drawnEntry).toBeVisible();

  // Park the tool: parcel clicks only land while the map is idle.
  await draw.click();

  // Analizar is already armed by the drawn polygon, so `clickAParcel`'s signal is
  // useless here — probe until the hit shows as the drawn entry disappearing.
  for (const position of PROBE_POSITIONS) {
    await mapCanvas(page).click({ position });

    try {
      await expect(drawnEntry).toBeHidden({ timeout: 700 });

      return;
    } catch {
      // Missed the cluster — try the next position.
    }
  }

  throw new Error('No probe position hit a cadastral parcel');
});
