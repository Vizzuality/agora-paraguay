import { expect, test, type Page } from '@playwright/test';

import { EAST_PARCEL_ID, stubAnalysisApi, WEST_PARCEL_ID } from './fixtures/api';
import { stubAuth } from './fixtures/auth';
import { drawPolygon, mapCanvas, stubBasemap, yellowPixelCount } from './fixtures/map';

// Canvas-relative coordinates (the canvas is the right half of the viewport,
// ~640px wide).
const FIRST_POLYGON = [
  { x: 300, y: 250 },
  { x: 360, y: 250 },
  { x: 360, y: 350 },
];

/** MapLibre's default `fitBounds` ease, with slack: clicks mid-flight hit the wrong spot. */
const FIT_ANIMATION = 800;

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

  // The (stubbed) parcel paints in the selection yellow over the drawn area once the
  // camera has flown there. It is larger than the drawing, so its painted area is the
  // reference for "the parcels are on the map" — the drawing alone would be smaller.
  await expect.poll(() => yellowPixelCount(page), { timeout: 10_000 }).toBeGreaterThan(200);
  const parcelsArea = await yellowPixelCount(page);

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

  // The backend requires every filter, so nothing is POSTed while the sowing date is
  // empty: the page asks for it instead of failing with a 400.
  await expect(
    page.getByText('Completa Fecha de siembra para ejecutar el análisis.'),
  ).toBeVisible();
  expect(analysisBodies).toHaveLength(0);

  // Typing it runs the analysis — one POST, with the API's default crop, the typed date
  // and the default indicators.
  await page.getByLabel('Fecha de siembra').fill('2026-05-01');
  await expect(page.getByLabel('Fecha de siembra')).toHaveValue('2026-05-01');
  await expect(page.getByText('Completa Fecha de siembra para ejecutar el análisis.')).toBeHidden();
  await expect.poll(() => analysisBodies.length).toBe(1);
  expect(analysisBodies[0]).toMatchObject({ crop_type: 'rice', sowing_date: '2026-05-01' });
  expect(analysisBodies[0].indicators).toContain('asian_rust');

  // Picking another crop re-runs it with the new filter.
  await cultivo.click();
  await page.getByRole('option', { name: 'Soja' }).click();
  await expect(cultivo).toHaveText('Soja');
  await expect.poll(() => analysisBodies.length).toBe(2);
  expect(analysisBodies[1]).toMatchObject({ crop_type: 'soy' });

  // The hero mini map paints the selected parcel over the (stubbed) satellite basemap —
  // the same layer as the main map, without Terra Draw — and is interactive.
  await expect(mapCanvas(page)).toBeVisible();
  await expect.poll(() => yellowPixelCount(page), { timeout: 10_000 }).toBeGreaterThan(200);
  await expect(page.getByRole('button', { name: 'Acercar' })).toBeVisible();

  // Todas first, then one hero tab per parcel the (stubbed) analysis answered, labelled
  // by its id; the page lands on Todas.
  const areas = page.getByRole('group', { name: 'Parcela' }).getByRole('listitem');
  await expect(areas).toHaveText(['Todas', WEST_PARCEL_ID, EAST_PARCEL_ID]);
  await expect(areas.first().getByRole('button')).toHaveAttribute('aria-current', 'true');

  // Under Todas the risk card combines the parcels: disease indices 3 and 1 average to
  // 2, the middle of the 1–3 range — the class as figure, the combined value as caption.
  const card = page
    .getByRole('heading', { name: 'Phakopsora pachyrhizi' })
    .locator('..')
    .locator('..');
  await expect(card).toContainText('Medio');
  await expect(card).toContainText('2');

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
  await expect.poll(() => analysisBodies.length).toBe(3);
  expect(analysisBodies[2].indicators).not.toContain('asian_rust');
  expect(analysisBodies[2].indicators).toContain('crop_type');
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
  await expect(page.getByRole('heading', { name: 'Resumen del análisis' })).toBeHidden();

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

  // Going back remounts the map; the selection survives, so the panel resumes on step 2
  // and the parcels are painted again from the cached answer.
  await page.goBack();
  await expect(controls(page).restart).toBeVisible();
  await expect(analyze).toBeEnabled();
  await expect(mapCanvas(page)).toBeVisible();
  await expect
    .poll(() => yellowPixelCount(page), { timeout: 10_000 })
    .toBeGreaterThan(parcelsArea * 0.8);
});

test('veils the map with a spinner while the parcels are looked up', async ({ page }) => {
  const { draw, analyze } = controls(page);

  // Registered after the stub, so it runs first: holds `filter-parcels` long enough to
  // see the spinner, then falls through to the stub.
  await page.route(
    (url) => url.pathname === '/api/parcels/filter-parcels/',
    async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.fallback();
    },
  );

  // Nothing pending before an area exists.
  // `<output>` is a status region; the role takes no name from its contents, so match text.
  const spinner = page.getByRole('status').filter({ hasText: 'Buscando parcelas…' });
  await expect(spinner).toBeHidden();

  // The finished drawing fires the lookup: the spinner sits over the map until the
  // parcels are in, then Analizar can go.
  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await expect(spinner).toBeVisible();
  await expect(spinner).toBeHidden({ timeout: 10_000 });
  await expect(analyze).toBeEnabled();
  await expect.poll(() => yellowPixelCount(page), { timeout: 10_000 }).toBeGreaterThan(200);
});

test('Selección de parcelas starts a new selection with an empty map', async ({ page }) => {
  const { draw, analyze, restart } = controls(page);

  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await expect.poll(() => yellowPixelCount(page), { timeout: 10_000 }).toBeGreaterThan(200);
  await analyze.click();
  await expect(page).toHaveURL(/\/analisis/);
  await expect(page.getByRole('group', { name: 'Parcela' })).toBeVisible();

  // Unlike the browser's Back (which resumes the selection), the header link starts
  // over: step 1 controls, nothing drawn, no parcels painted.
  await page.getByRole('banner').getByRole('link', { name: 'Selección de parcelas' }).click();
  await expect(page).toHaveURL(/\/(\?|$)/);
  await expect(draw).toHaveText('Dibujar polígono');
  await expect(analyze).toBeHidden();
  await expect(restart).toBeHidden();
  await expect(mapCanvas(page)).toBeVisible();
  await expect.poll(() => yellowPixelCount(page), { timeout: 10_000 }).toBe(0);

  // The old run is gone for good: forward to /analisis lands back on / (empty selection).
  await page.goForward();
  await expect(page).toHaveURL(/\/(\?|$)/);
  await expect(analyze).toBeHidden();

  // A fresh drawing works as on a first visit, and its analysis lands on Todas again.
  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await expect(analyze).toBeEnabled();
  await analyze.click();
  await expect(page).toHaveURL(/\/analisis/);
  const tabs = page.getByRole('group', { name: 'Parcela' }).getByRole('listitem');
  await expect(tabs.first()).toHaveText('Todas');
  await expect(tabs.first().getByRole('button')).toHaveAttribute('aria-current', 'true');

  // The footer repeats the link with the same reset.
  await page.getByRole('contentinfo').getByRole('link', { name: 'Selección de parcelas' }).click();
  await expect(page).toHaveURL(/\/(\?|$)/);
  await expect(analyze).toBeHidden();
  await expect.poll(() => yellowPixelCount(page), { timeout: 10_000 }).toBe(0);
});

test('opens a parcel tab from the list dropdown and from the mini map', async ({ page }) => {
  const { draw, analyze } = controls(page);

  const analysisRuns: string[] = [];
  page.on('request', (request) => {
    const { pathname } = new URL(request.url());
    if (pathname === '/api/parcels/analysis/diseases/' && request.method() === 'POST') {
      analysisRuns.push(pathname);
    }
  });

  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await analyze.click();
  await expect(page).toHaveURL(/\/analisis/);
  // The sowing date has no default and the backend requires it: nothing runs until typed.
  await page.getByLabel('Fecha de siembra').fill('2026-05-01');

  const tabs = page.getByRole('group', { name: 'Parcela' }).getByRole('listitem');
  const allTab = tabs.filter({ hasText: 'Todas' }).getByRole('button');
  const westTab = tabs.filter({ hasText: WEST_PARCEL_ID }).getByRole('button');
  const eastTab = tabs.filter({ hasText: EAST_PARCEL_ID }).getByRole('button');
  const card = page
    .getByRole('heading', { name: 'Phakopsora pachyrhizi' })
    .locator('..')
    .locator('..');

  // Lands on Todas: the combined index (3 and 1 → 2) reads "Medio".
  await expect(allTab).toHaveAttribute('aria-current', 'true');
  await expect(card).toContainText('Medio');
  await expect.poll(() => analysisRuns.length).toBe(1);

  // The list button opens a single-choice menu — Todas, then the analysed parcels — with
  // the open one marked. Picking a parcel opens its tab and swaps the cards to its values.
  await page.getByRole('button', { name: 'Ver lista de parcelas' }).click();
  const menu = page.getByRole('menu');
  await expect(menu.getByRole('menuitemradio')).toHaveText([
    'Todas',
    WEST_PARCEL_ID,
    EAST_PARCEL_ID,
  ]);
  await expect(menu.getByRole('menuitemradio', { name: 'Todas' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await menu.getByRole('menuitemradio', { name: EAST_PARCEL_ID }).click();
  await expect(menu).toBeHidden();
  await expect(eastTab).toHaveAttribute('aria-current', 'true');
  await expect(allTab).not.toHaveAttribute('aria-current', 'true');
  await expect(card).toContainText('Bajo');

  // Back to Todas from the strip: both parcels paint again, the frame fits them both.
  // The two stubbed parcels split the drawn bbox down the middle and are taller than
  // wide, so fitted they fill the canvas height and sit centred horizontally.
  await allTab.click();
  await expect(card).toContainText('Medio');
  const canvas = mapCanvas(page);
  await expect(canvas).toBeVisible();
  await expect.poll(() => yellowPixelCount(page), { timeout: 10_000 }).toBeGreaterThan(200);
  await page.waitForTimeout(FIT_ANIMATION);
  const bothArea = await yellowPixelCount(page);
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Mini map canvas has no bounding box');
  const centre = { x: box.width / 2, y: box.height / 2 };
  const offset = box.height * 0.15;

  // A click a little left of centre lands on the west parcel: its tab opens, only it
  // paints, and the frame fits it — narrower than both, so less yellow on screen.
  await canvas.click({ position: { x: centre.x - offset, y: centre.y } });
  await expect(westTab).toHaveAttribute('aria-current', 'true');
  await expect(card).toContainText('Alto');
  await page.waitForTimeout(FIT_ANIMATION);
  await expect.poll(() => yellowPixelCount(page)).toBeLessThan(bothArea * 0.75);

  // With the west parcel centred, the east one sits right of it: a click there opens
  // its tab. Switching tabs never re-runs the analysis — the cards come from the answer
  // already in hand.
  await canvas.click({ position: { x: centre.x + offset, y: centre.y } });
  await expect(eastTab).toHaveAttribute('aria-current', 'true');
  await expect(card).toContainText('Bajo');
  expect(analysisRuns).toHaveLength(1);
});

test('swaps the login card for the reset-password card and back', async ({ page }) => {
  const { draw, analyze } = controls(page);

  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await analyze.click();
  await page.getByRole('banner').getByRole('link', { name: 'Riesgo productivo' }).click();
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();

  // The reset card (Figma node 5596:1619) takes the login card's slot in the gate.
  await page.getByRole('button', { name: 'Restablecer contraseña' }).click();
  await expect(page.getByRole('heading', { name: 'Restablecer contraseña' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Solicitar' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Acceder' })).toBeHidden();

  // Solicitar hands off to the mail client (a mailto, which leaves the tab in place)
  // and turns the card into the confirmation naming the email.
  await page.getByLabel('Email').fill('ana@example.org');
  await page.getByRole('button', { name: 'Solicitar' }).click();
  await expect(page.getByRole('heading', { name: 'Solicitud enviada' })).toBeVisible();
  await expect(page.getByText('Si la dirección ana@example.org está registrada')).toBeVisible();
  await expect(page).toHaveURL(/riesgo=productivo/);

  // "Enviar otra solicitud" returns to the form…
  await page.getByRole('button', { name: 'Enviar otra solicitud' }).click();
  await expect(page.getByRole('heading', { name: 'Restablecer contraseña' })).toBeVisible();

  // …and its link brings the login card back.
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).last().click();
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  await expect(page.getByLabel('Usuario')).toBeVisible();
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

  // The popover swaps to the reset card too, and reopens on the login form.
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await dialog.getByRole('button', { name: 'Restablecer contraseña' }).click();
  await expect(dialog.getByRole('heading', { name: 'Restablecer contraseña' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(dialog.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
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

  await expect(page.getByRole('heading', { name: 'Resumen del análisis' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Generar resumen' })).toBeVisible();

  // While the session is active the user button is a no-op.
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(dialog).toBeHidden();
});
