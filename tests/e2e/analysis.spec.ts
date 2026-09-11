import { expect, test, type Page } from '@playwright/test';

import { stubAnalysisApi } from './fixtures/api';
import { stubAuth } from './fixtures/auth';
import { drawPolygon, mapCanvas, stubBasemap } from './fixtures/map';

// Canvas-relative coordinates (the canvas is the right half of the viewport,
// ~640px wide).
const FIRST_POLYGON = [
  { x: 300, y: 250 },
  { x: 360, y: 250 },
  { x: 360, y: 350 },
];

function controls(page: Page) {
  return {
    // Tolerant of both labels: the button reads "Cancelar" while a session is armed.
    draw: page.getByRole('button', { name: /Dibujar polígono|Cancelar/ }),
    // Step 2 only: it appears once an area is on the map.
    analyze: page.getByRole('button', { name: 'Analizar' }),
    restart: page.getByRole('button', { name: 'Reiniciar' }),
  };
}

test.beforeEach(async ({ page }) => {
  await stubBasemap(page);
  await stubAnalysisApi(page);
  await stubAuth(page);
  await page.goto('/');

  await expect(controls(page).draw).toBeEnabled();
  await expect(mapCanvas(page)).toBeVisible();
});

test('analyzes the drawn area and moves to the analysis page', async ({ page }) => {
  const { draw, analyze } = controls(page);

  // Nothing on the map yet: step 1, no Analizar.
  await expect(analyze).toBeHidden();

  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await expect(analyze).toBeEnabled();

  // A successful submission navigates to the analysis page.
  await analyze.click();
  await expect(page).toHaveURL(/\/analisis/);
  await expect(page.getByRole('heading', { name: 'Riesgo sanitario' })).toBeVisible();

  // The hero mini map renders the analysed parcel over the (stubbed) satellite basemap.
  await expect(mapCanvas(page)).toBeVisible();

  // The submitted area appears as the hero's parcel tab under its generated name.
  const areas = page.getByRole('group', { name: 'Parcela' }).getByRole('listitem');
  await expect(areas).toHaveText(['Área dibujada 1']);

  // The navbar offers the way back and the login entry point (Figma node 5180:12072).
  // Locators are scoped to the header because the footer repeats the same link names.
  const navbar = page.getByRole('banner');
  await expect(navbar.getByRole('link', { name: 'Selección de parcelas' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();

  // Analizar lands on riesgo sanitario, which is public: no login gate.
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeHidden();

  // The risk tabs live in the URL, not the store: switching updates ?riesgo.
  // Riesgo productivo is private, gated behind the login card (Figma node 5180:11125).
  await navbar.getByRole('link', { name: 'Riesgo productivo' }).click();
  await expect(page).toHaveURL(/riesgo=productivo/);
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  await expect(page.getByLabel('Usuario')).toBeVisible();
  await expect(page.getByLabel('Contraseña')).toBeVisible();

  // Back on the public tab the gate goes away again.
  await navbar.getByRole('link', { name: 'Riesgo sanitario' }).click();
  await expect(page).toHaveURL(/riesgo=sanitario/);
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeHidden();

  // The footer repeats the brand and the three destinations (Figma node 5180:11421).
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('link', { name: 'Inicio' })).toBeVisible();
  await footer.getByRole('link', { name: 'Riesgo productivo' }).click();
  await expect(page).toHaveURL(/riesgo=productivo/);
  await expect(footer.getByRole('link', { name: 'Selección de parcelas' })).toBeVisible();

  // Stubbed login (`stubAuth`): any credentials open the private indicators in place.
  await page.getByLabel('Usuario').fill('analista');
  await page.getByLabel('Contraseña').fill('cualquiera');
  await page.getByRole('button', { name: 'Acceder' }).click();
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeHidden();
  await expect(page).toHaveURL(/riesgo=productivo/);

  // Going back remounts the map; the selection survives, so the panel resumes on step 2.
  await page.goBack();
  await expect(controls(page).restart).toBeVisible();
  await expect(analyze).toBeEnabled();
});

test('logs in from the header dialog', async ({ page }) => {
  const { draw, analyze } = controls(page);

  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await analyze.click();
  await expect(page).toHaveURL(/\/analisis/);

  // The header's user button opens the login dialog (Figma node 5351:11729); its
  // accessible name comes from the dialog's screen-reader-only title.
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  const dialog = page.getByRole('dialog', { name: 'Iniciar sesión' });
  await expect(dialog).toBeVisible();

  // Escape dismisses it without logging in.
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  // Logging in through the dialog closes it…
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await dialog.getByLabel('Usuario').fill('analista');
  await dialog.getByLabel('Contraseña').fill('cualquiera');
  await dialog.getByRole('button', { name: 'Acceder' }).click();
  await expect(dialog).toBeHidden();

  // …and unlocks riesgo productivo: no in-page gate, the private title shows.
  const navbar = page.getByRole('banner');
  await navbar.getByRole('link', { name: 'Riesgo productivo' }).click();
  await expect(page).toHaveURL(/riesgo=productivo/);
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Riesgo productivo' })).toBeVisible();

  // While the session is active the user button is a no-op.
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(dialog).toBeHidden();
});
