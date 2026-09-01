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
  // Analizar lands on the public tab, whose hero titles the page (AGP-21).
  await expect(page.getByRole('heading', { name: 'Riesgo sanitario' })).toBeVisible();

  // The submitted areas are listed, read-only, with the same names as the panel list.
  const areas = page.getByRole('list').getByRole('listitem');
  await expect(areas).toHaveText(['Área dibujada 1', 'Área dibujada 2']);

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
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Contraseña')).toBeVisible();

  // Back on the public tab the gate goes away again.
  await navbar.getByRole('link', { name: 'Riesgo sanitario' }).click();
  await expect(page).toHaveURL(/riesgo=sanitario/);
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeHidden();

  // The footer repeats the brand and the three destinations (Figma node 5180:11421).
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('link', { name: 'Ágora — inicio' })).toBeVisible();
  await footer.getByRole('link', { name: 'Riesgo productivo' }).click();
  await expect(page).toHaveURL(/riesgo=productivo/);
  await expect(footer.getByRole('link', { name: 'Selección de parcelas' })).toBeVisible();

  // Mock login: any well-formed credentials open the private indicators in place
  // (the real user/password check arrives with the GMV backend).
  await page.getByLabel('Email').fill('analista@example.com');
  await page.getByLabel('Contraseña').fill('cualquiera');
  await page.getByRole('button', { name: 'Acceder' }).click();
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeHidden();
  await expect(page).toHaveURL(/riesgo=productivo/);

  // Going back remounts the map; the selection survives and is editable again.
  await page.goBack();
  await expect(controls(page).draw).toBeEnabled();
  await expect(firstEntry).toBeVisible();
  await expect(secondEntry).toBeVisible();
  await expect(analyze).toBeEnabled();
});
