import { expect, test, type Page } from '@playwright/test';

import { mapCanvas, stubBasemap } from './fixtures/map';

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
    draw: page.getByRole('button', { name: 'Dibujar polígono' }),
    analyze: page.getByRole('button', { name: 'Analizar' }),
  };
}

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

test('clicking cadastral parcels selects until Analizar ends the session', async ({ page }) => {
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

  await analyze.click();
  await expect(page.getByText('Análisis aceptado: se envió 1 área.')).toBeVisible();

  // The session is over: the same click no longer toggles the parcel off, so the
  // selection (and with it the button) survives.
  await mapCanvas(page).click({ position });
  await expect(analyze).toBeEnabled();
});
