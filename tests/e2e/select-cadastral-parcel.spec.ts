import { expect, test, type Page } from '@playwright/test';

import { stubAnalysisApi } from './fixtures/api';
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
    // Step 2 only: it appears once anything is selected.
    analyze: page.getByRole('button', { name: 'Analizar' }),
  };
}

/** Clear of the parcel cluster; from `draw.spec.ts`. */
const DRAWN_POLYGON = [
  { x: 440, y: 450 },
  { x: 500, y: 450 },
  { x: 500, y: 550 },
];

/** Clicks probe positions until one selects a parcel (Analizar appears), returns it. */
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

/**
 * Hovers probe positions until the map offers a pointer, which is how the click
 * handler signals a parcel under the cursor (`use-parcel-click.ts`). Lets a spec find
 * a parcel without changing the selection.
 */
async function findAParcel(page: Page) {
  const canvas = mapCanvas(page);

  for (const position of PROBE_POSITIONS) {
    await canvas.hover({ position });

    const cursor = await canvas.evaluate((element) => element.style.cursor);

    if (cursor === 'pointer') return position;
  }

  throw new Error('No probe position hovered a cadastral parcel');
}

test.beforeEach(async ({ page }) => {
  await stubBasemap(page);
  await stubAnalysisApi(page);
  await page.goto('/');

  // The draw button arming is the signal that Terra Draw is bound, which also gates
  // the parcel clicks.
  await expect(locators(page).draw).toBeEnabled();
  await expect(mapCanvas(page)).toBeVisible();
});

test('clicking cadastral parcels selects until Analizar submits them', async ({ page }) => {
  const { analyze } = locators(page);

  // Nothing drawn and nothing selected: step 1, no Analizar yet.
  await expect(analyze).toBeHidden();

  const position = await clickAParcel(page);

  // A second click on the same parcel toggles it back off (and the panel back to step 1)…
  await mapCanvas(page).click({ position });
  await expect(analyze).toBeHidden();

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

// Step 2 is where the user refines the parcels around their área de interés (Figma
// 7172:1799: "use el mapa para seleccionar y deseleccionar parcelas"), so a parcel
// click adds to the drawn polygon instead of replacing it.
test('clicking a parcel in step 2 keeps the drawn polygon', async ({ page }) => {
  const { draw, analyze } = locators(page);

  await draw.click();
  await drawPolygon(page, DRAWN_POLYGON);
  // Finishing the polygon parks the tool, so parcel clicks land straight away.
  await expect(analyze).toBeEnabled();

  const position = await findAParcel(page);
  await mapCanvas(page).click({ position });
  await expect(analyze).toBeEnabled();

  await analyze.click();
  await expect(page).toHaveURL(/\/analisis/);

  // Both made it: the drawn area and the clicked parcel.
  const areas = page.getByRole('group', { name: 'Parcela' }).getByRole('listitem');
  await expect(areas).toHaveCount(2);
  await expect(areas.first()).toHaveText('Área dibujada 1');
});
