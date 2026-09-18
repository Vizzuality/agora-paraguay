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

  // The hero filters belong to /analisis: nothing on / may ask for them. The analysis
  // itself runs there too, once per distinct request.
  let filtersRequests = 0;
  const analysisBodies: { indicators: string[]; crop_type?: string }[] = [];
  page.on('request', (request) => {
    const { pathname } = new URL(request.url());
    if (pathname === '/api/parcels/filters/') filtersRequests += 1;
    if (pathname === '/api/parcels/analysis/diseases/' && request.method() === 'POST') {
      analysisBodies.push(request.postDataJSON() as { indicators: string[]; crop_type?: string });
    }
  });

  // Nothing on the map yet: step 1, no Analizar.
  await expect(analyze).toBeHidden();

  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await expect(analyze).toBeEnabled();
  expect(filtersRequests).toBe(0);

  // Analizar only navigates; nothing was POSTed from /.
  await analyze.click();
  await expect(page).toHaveURL(/\/analisis/);
  await expect(page.getByRole('heading', { name: 'Riesgo sanitario' })).toBeVisible();
  expect(analysisBodies).toHaveLength(0);

  // The hero renders one field per filter the public side returned, named after it: a
  // dropdown for the category with its first option preselected, a date input per date
  // (empty without a default, the API's default otherwise).
  const cultivo = page.getByRole('combobox', { name: 'Tipo de cultivo' });
  await expect(cultivo).toBeEnabled();
  await expect(cultivo).toHaveText('Arroz');
  await expect(page.getByRole('combobox')).toHaveCount(1);
  await expect(page.getByLabel('Fecha de siembra')).toHaveValue('');
  await expect(page.getByLabel('Fecha', { exact: true })).toHaveValue('2026-09-17');
  expect(filtersRequests).toBe(1);

  // The analysis ran once the filters, parcels and indicators were known — one POST,
  // with the API's default crop and the default indicators.
  await expect.poll(() => analysisBodies.length).toBe(1);
  expect(analysisBodies[0]).toMatchObject({ crop_type: 'rice' });
  expect(analysisBodies[0].indicators).toContain('asian_rust');

  // Picking another crop re-runs it with the new filter.
  await cultivo.click();
  await page.getByRole('option', { name: 'Soja' }).click();
  await expect(cultivo).toHaveText('Soja');
  await expect.poll(() => analysisBodies.length).toBe(2);
  expect(analysisBodies[1]).toMatchObject({ crop_type: 'soy' });
  await page.getByLabel('Fecha de siembra').fill('2026-05-01');
  await expect(page.getByLabel('Fecha de siembra')).toHaveValue('2026-05-01');
  await expect.poll(() => analysisBodies.length).toBe(3);

  // The hero mini map renders the analysed parcel over the (stubbed) satellite basemap.
  await expect(mapCanvas(page)).toBeVisible();

  // One hero tab per parcel the (stubbed) analysis answered, labelled by its id.
  const areas = page.getByRole('group', { name: 'Parcela' }).getByRole('listitem');
  await expect(areas).toHaveText(['D07D21P00000002']);

  // The active parcel's disease index sits at the top of its 1–3 range: a risk class
  // card with the class as its figure and the measured value as caption.
  const card = page
    .getByRole('heading', { name: 'Phakopsora pachyrhizi' })
    .locator('..')
    .locator('..');
  await expect(card).toContainText('Alto');
  await expect(card).toContainText('3');

  // Its text facts (crop, station, phenology) share one general-info card instead.
  const info = page.getByRole('heading', { name: 'Información general' }).locator('..');
  await expect(info).toContainText('Tipo de cultivo');
  await expect(info).toContainText('Soja');

  // Personalizar indicadores: the title-row button opens a checklist of the measured
  // indicators. General info is not in it — it is always shown.
  await page.getByRole('button', { name: 'Personalizar indicadores' }).click();
  const list = page.getByRole('list', { name: 'Indicadores' });
  await expect(list.getByRole('checkbox', { name: 'Phakopsora pachyrhizi' })).toBeChecked();
  await expect(list.getByRole('checkbox', { name: 'Tipo de cultivo' })).toHaveCount(0);

  // The search box filters the list, accent-insensitively.
  await page.getByRole('searchbox', { name: 'Buscar indicador' }).fill('phakopsora');
  await expect(list.getByRole('checkbox')).toHaveCount(1);
  await page.getByRole('searchbox', { name: 'Buscar indicador' }).fill('zzz');
  await expect(list).toContainText('Sin resultados');
  await page.getByRole('searchbox', { name: 'Buscar indicador' }).fill('');

  // Unchecking an indicator re-runs the analysis without it and removes its card; the
  // general-info card stays. The input is visually hidden (the check glyph is the cue),
  // so the label row is what gets clicked.
  await list.getByText('Phakopsora pachyrhizi').click();
  await expect(list.getByRole('checkbox', { name: 'Phakopsora pachyrhizi' })).not.toBeChecked();
  await page.keyboard.press('Escape');
  await expect.poll(() => analysisBodies.length).toBe(4);
  expect(analysisBodies[3].indicators).not.toContain('asian_rust');
  expect(analysisBodies[3].indicators).toContain('crop_type');
  await expect(page.getByRole('heading', { name: 'Phakopsora pachyrhizi' })).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Información general' })).toBeVisible();

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
