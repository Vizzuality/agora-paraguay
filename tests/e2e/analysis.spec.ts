import { expect, test, type Page } from '@playwright/test';

import { stubAnalysisApi } from './fixtures/api';
import { ADMIN_USERS, stubAdminUsers, stubAuth } from './fixtures/auth';
import {
  drawPolygon,
  FARM_SCALE_URL,
  mapCanvas,
  stubBasemap,
  yellowPixelCount,
  zoomToFarmScale,
} from './fixtures/map';

// Canvas-relative coordinates (the canvas is the right half of the viewport,
// ~640px wide).
const FIRST_POLYGON = [
  { x: 300, y: 250 },
  { x: 360, y: 250 },
  { x: 360, y: 350 },
];

/** MapLibre's default `fitBounds` ease, with slack: clicks mid-flight hit the wrong spot. */
const FIT_ANIMATION = 800;

/** Today as the hero's date inputs write it — the default of a date filter the API leaves blank. */
const TODAY = (() => {
  const now = new Date();
  const pad = (part: number) => String(part).padStart(2, '0');

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
})();

function controls(page: Page) {
  return {
    // Tolerant of both labels: the button reads "Cancelar" while a session is armed.
    draw: page.getByRole('button', { name: /Dibujar polígono|Cancelar/ }),
    // Step 2 only: it appears once an area is on the map.
    analyze: page.getByRole('button', { name: 'Analizar' }),
    restart: page.getByRole('button', { name: 'Reiniciar' }),
  };
}

/** Draws the first polygon and takes Analizar to the analysis page. */
async function analyzeFirstPolygon(page: Page) {
  const { draw, analyze } = controls(page);

  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await analyze.click();
  await expect(page).toHaveURL(/\/analisis/);
}

/** Signs in through the header dialog (stubbed: any credentials) and waits for it to close. */
async function loginFromHeader(page: Page, email = 'analista@example.com') {
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  const dialog = page.getByRole('dialog', { name: 'Iniciar sesión' });
  await dialog.getByLabel('Email').fill(email);
  await dialog.getByLabel('Contraseña').fill('cualquiera');
  await dialog.getByRole('button', { name: 'Acceder' }).click();
  await expect(dialog).toBeHidden();
}

test.beforeEach(async ({ page }) => {
  await stubBasemap(page);
  await stubAnalysisApi(page);
  await stubAuth(page);
  // Zoomed in to farm scale: at the opening zoom the test triangle covers a department,
  // over the area limit (see 'a drawing over the area limit').
  await page.goto(FARM_SCALE_URL);

  await expect(controls(page).draw).toBeEnabled();
  await expect(mapCanvas(page)).toBeVisible();
});

test('analyzes the drawn area and moves to the analysis page', async ({ page }) => {
  const { draw, analyze } = controls(page);

  // The hero filters belong to /analisis: nothing on / may ask for them. The analysis
  // itself runs there too, once per distinct request.
  let filtersRequests = 0;
  const filtersUrls: string[] = [];
  const analysisBodies: { indicators: string[]; crop_type?: string }[] = [];
  page.on('request', (request) => {
    const { pathname, search } = new URL(request.url());
    if (pathname === '/api/parcels/filters/') {
      filtersRequests += 1;
      filtersUrls.push(pathname + search);
    }
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

  // The hero mini map numbers the analysed parcels as their tabs do: two chips, or one
  // reading "1, 2" when the camera puts the two centroids too close to keep apart.
  await expect
    .poll(async () => {
      const chips = await page.locator('[data-slot=parcel-number]').allTextContents();

      return chips.join(', ');
    })
    .toBe('1, 2');

  // The hero renders one field per filter the public side returned, named after it: a
  // dropdown for the category with its first option preselected, a date input per date
  // (the API's default, else today).
  const cultivo = page.getByRole('combobox', { name: 'Tipo de cultivo' });
  await expect(cultivo).toBeEnabled();
  await expect(cultivo).toHaveText('Arroz');
  await expect(page.getByRole('combobox')).toHaveCount(1);
  await expect(page.getByLabel('Fecha de siembra')).toHaveValue(TODAY);
  await expect(page.getByLabel('Fecha', { exact: true })).toHaveValue('2026-09-17');
  // Asked for the riesgo alone: with no crop picked yet, the API's default crop applies.
  expect(filtersRequests).toBe(1);
  expect(filtersUrls).toEqual(['/api/parcels/filters/?riesgo=sanitario']);

  // Picking the crop already shown asks nothing: that answer seeded the default crop's
  // entry, so only another crop would fetch again.
  await cultivo.click();
  await page.getByRole('option', { name: 'Arroz' }).click();
  await expect(cultivo).toHaveText('Arroz');
  expect(filtersUrls).toEqual(['/api/parcels/filters/?riesgo=sanitario']);

  // Every filter has a value, so the analysis runs at once — one POST, with the API's
  // default crop, today as the sowing date and the default indicators.
  await expect.poll(() => analysisBodies.length).toBe(1);
  expect(analysisBodies[0]).toMatchObject({ crop_type: 'rice', sowing_date: TODAY });
  expect(analysisBodies[0].indicators).toContain('asian_rust');

  // Typing a sowing date re-runs it with that date.
  await page.getByLabel('Fecha de siembra').fill('2026-05-01');
  await expect(page.getByLabel('Fecha de siembra')).toHaveValue('2026-05-01');
  await expect.poll(() => analysisBodies.length).toBe(2);
  expect(analysisBodies[1]).toMatchObject({ sowing_date: '2026-05-01' });

  // Picking another crop re-runs it with the new filter.
  await cultivo.click();
  await page.getByRole('option', { name: 'Soja' }).click();
  await expect(cultivo).toHaveText('Soja');
  await expect.poll(() => analysisBodies.length).toBe(3);
  expect(analysisBodies[2]).toMatchObject({ crop_type: 'soy' });

  // So does changing the defaulted date: the value is part of the query key.
  await page.getByLabel('Fecha', { exact: true }).fill('2026-09-10');
  await expect.poll(() => analysisBodies.length).toBe(4);
  expect(analysisBodies[3]).toMatchObject({ date: '2026-09-10', sowing_date: '2026-05-01' });

  // The hero mini map paints the selected parcel over the (stubbed) satellite basemap —
  // the same layer as the main map, without Terra Draw and without the zoom buttons.
  await expect(mapCanvas(page)).toBeVisible();
  await expect.poll(() => yellowPixelCount(page), { timeout: 10_000 }).toBeGreaterThan(200);
  await expect(page.getByRole('button', { name: 'Acercar' })).toHaveCount(0);

  // Todas first, then one hero tab per parcel the (stubbed) analysis answered, numbered
  // in submission order rather than by cadastral id; the page lands on Todas.
  const areas = page.getByRole('group', { name: 'Parcela' }).getByRole('listitem');
  await expect(areas).toHaveText(['Todas', 'Parcela 1', 'Parcela 2']);
  await expect(areas.first().getByRole('button')).toHaveAttribute('aria-current', 'true');

  // Under Todas the disease card counts the parcels per class rather than averaging them
  // (the "Categorical multiple" design): indices 3 and 1 put one parcel in Severo and one
  // in Sin riesgo. The counts are listed for assistive tech under the chart.
  const card = page
    .getByRole('heading', { name: 'Phakopsora pachyrhizi' })
    .locator('..')
    .locator('..');
  await expect(card).toContainText('Número de parcelas');
  await expect(card.getByRole('listitem')).toHaveText([
    'Sin riesgo: 1',
    'Moderado: 0',
    'Severo: 1',
  ]);

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
  await expect.poll(() => analysisBodies.length).toBe(5);
  expect(analysisBodies[4].indicators).not.toContain('asian_rust');
  expect(analysisBodies[4].indicators).toContain('crop_type');
  await expect(page.getByRole('heading', { name: 'Phakopsora pachyrhizi' })).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Información general' })).toBeVisible();

  // The navbar offers the way back and the login entry point.
  // Locators are scoped to the header because the footer repeats the same link names.
  const navbar = page.getByRole('banner');
  await expect(navbar.getByRole('link', { name: 'Selección de parcelas' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();

  // Analizar lands on riesgo sanitario, which is public: no login gate.
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeHidden();

  // The risk tabs live in the URL, not the store: each is its own route under /analisis.
  // Riesgo productivo is private, gated behind the login card.
  await navbar.getByRole('link', { name: 'Riesgo productivo' }).click();
  await expect(page).toHaveURL(/\/analisis\/productivo/);
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Contraseña')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Resumen del análisis' })).toBeHidden();

  // Back on the public tab the gate goes away again.
  await navbar.getByRole('link', { name: 'Riesgo sanitario' }).click();
  await expect(page).toHaveURL(/\/analisis\/sanitario/);
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeHidden();

  // The footer repeats the brand and the three destinations.
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('link', { name: 'Inicio' })).toBeVisible();
  await footer.getByRole('link', { name: 'Riesgo productivo' }).click();
  await expect(page).toHaveURL(/\/analisis\/productivo/);
  await expect(footer.getByRole('link', { name: 'Selección de parcelas' })).toBeVisible();

  // Stubbed login (`stubAuth`): any credentials open the private indicators in place.
  await page.getByLabel('Email').fill('analista@example.com');
  await page.getByLabel('Contraseña').fill('cualquiera');
  await page.getByRole('button', { name: 'Acceder' }).click();
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeHidden();
  await expect(page).toHaveURL(/\/analisis\/productivo/);

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

test('says why when the indicator list cannot be loaded', async ({ page }) => {
  const { draw, analyze } = controls(page);

  // Registered after `stubAnalysisApi`, so Playwright tries it first: the proxy answers
  // the way it does when the API is down, with the reason in the body.
  await page.route(
    (url) => url.pathname === '/api/parcels/indicators',
    (route) =>
      route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'The API could not be reached.' }),
      }),
  );

  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await analyze.click();
  await expect(page).toHaveURL(/\/analisis/);

  // The page names the failure with the API's reason (after the query's retries), and
  // the picker says the same instead of opening empty.
  const reason = 'No se pudieron cargar los indicadores: The API could not be reached.';
  await expect(page.getByRole('alert').filter({ hasText: reason })).toBeVisible({
    timeout: 20_000,
  });
  await page.getByRole('button', { name: 'Personalizar indicadores' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toHaveText(reason);
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
  // (Zoomed in again: the reset put the camera back on the country-wide view.)
  await zoomToFarmScale(page);
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

test('opens the metadata description from the info icon on hero fields and cards', async ({
  page,
}) => {
  await analyzeFirstPolygon(page);

  // Only what the metadata describes gets an icon, named after its subject: the crop
  // filter (in the hero and, echoed as a text indicator, in the general-info card) and
  // the rust indicator. The dates and the area carry no description: no icon.
  const infoButtons = page.getByRole('button', { name: /^Más información sobre / });
  await expect(infoButtons).toHaveCount(3);
  await expect(
    page.getByRole('button', { name: 'Más información sobre Fecha de siembra' }),
  ).toHaveCount(0);

  // The hero select's icon sits in its floating label and opens the filter's description.
  const cropField = page.getByRole('combobox', { name: 'Tipo de cultivo' }).locator('..');
  await cropField.getByRole('button', { name: 'Más información sobre Tipo de cultivo' }).click();
  const popover = page.getByRole('dialog');
  await expect(popover).toContainText('Cultivo a evaluar.');
  await page.keyboard.press('Escape');
  await expect(popover).toBeHidden();

  // The risk card's icon opens the indicator's, and the keyboard reaches it too. Its
  // `{'id': 'date'}` reference reads as the hero's date, dd/mm/yyyy.
  const rustInfo = page.getByRole('button', {
    name: 'Más información sobre Phakopsora pachyrhizi',
  });
  await rustInfo.focus();
  await page.keyboard.press('Enter');
  await expect(popover).toContainText('Enfermedad favorecida por humedad elevada');
  await expect(popover).toContainText('previas a 17/09/2026.');
  await page.keyboard.press('Escape');
  await expect(popover).toBeHidden();
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

  const tabs = page.getByRole('group', { name: 'Parcela' }).getByRole('listitem');
  const allTab = tabs.filter({ hasText: 'Todas' }).getByRole('button');
  const westTab = tabs.filter({ hasText: 'Parcela 1' }).getByRole('button');
  const eastTab = tabs.filter({ hasText: 'Parcela 2' }).getByRole('button');
  const card = page
    .getByRole('heading', { name: 'Phakopsora pachyrhizi' })
    .locator('..')
    .locator('..');
  const level = card.locator('[data-slot="risk-level"]');
  const counts = card.getByRole('listitem');
  // The thumbnail prints the open tab's area: the parcels summed under Todas.

  // Lands on Todas: the parcels counted per class (indices 3 and 1), no single figure.
  await expect(allTab).toHaveAttribute('aria-current', 'true');
  await expect(counts).toHaveText(['Sin riesgo: 1', 'Moderado: 0', 'Severo: 1']);
  await expect(level).toHaveCount(0);
  await expect(page.getByText('17,5 ha').filter({ visible: true })).toBeVisible();
  await expect.poll(() => analysisRuns.length).toBe(1);

  // The list button opens a single-choice menu — Todas, then the analysed parcels — with
  // the open one marked. Picking a parcel opens its tab and swaps the cards to its values.
  await page.getByRole('button', { name: 'Ver lista de parcelas' }).click();
  const menu = page.getByRole('menu');
  await expect(menu.getByRole('menuitemradio')).toHaveText(['Todas', 'Parcela 1', 'Parcela 2']);
  await expect(menu.getByRole('menuitemradio', { name: 'Todas' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await menu.getByRole('menuitemradio', { name: 'Parcela 2' }).click();
  await expect(menu).toBeHidden();
  await expect(eastTab).toHaveAttribute('aria-current', 'true');
  await expect(allTab).not.toHaveAttribute('aria-current', 'true');
  await expect(level).toHaveText('Sin riesgo');
  await expect(page.getByText('7,3 ha').filter({ visible: true })).toBeVisible();

  // Back to Todas from the strip: both parcels paint again, the frame fits them both.
  // The two stubbed parcels split the drawn bbox down the middle and are taller than
  // wide, so fitted they fill the canvas height and sit centred horizontally.
  await allTab.click();
  await expect(counts).toHaveText(['Sin riesgo: 1', 'Moderado: 0', 'Severo: 1']);
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
  await expect(level).toHaveText('Severo');
  await expect(page.getByText('10,2 ha').filter({ visible: true })).toBeVisible();
  await page.waitForTimeout(FIT_ANIMATION);
  await expect.poll(() => yellowPixelCount(page)).toBeLessThan(bothArea * 0.75);

  // With the west parcel centred, the east one sits right of it: a click there opens
  // its tab. Switching tabs never re-runs the analysis — the cards come from the answer
  // already in hand.
  await canvas.click({ position: { x: centre.x + offset, y: centre.y } });
  await expect(eastTab).toHaveAttribute('aria-current', 'true');
  await expect(level).toHaveText('Sin riesgo');
  expect(analysisRuns).toHaveLength(1);
});

test('swaps the login card for the reset-password card and back', async ({ page }) => {
  const { draw, analyze } = controls(page);

  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await analyze.click();
  await page.getByRole('banner').getByRole('link', { name: 'Riesgo productivo' }).click();
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();

  // The reset card takes the login card's slot in the gate.
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
  await expect(page).toHaveURL(/\/analisis\/productivo/);

  // "Enviar otra solicitud" returns to the form…
  await page.getByRole('button', { name: 'Enviar otra solicitud' }).click();
  await expect(page.getByRole('heading', { name: 'Restablecer contraseña' })).toBeVisible();

  // …and its link brings the login card back.
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).last().click();
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
});

test('closes the session from the user menu', async ({ page }) => {
  await analyzeFirstPolygon(page);
  await loginFromHeader(page);

  // Signed in, the user button opens the account menu instead:
  // password reset is listed but out of scope, so it stays disabled.
  const navbar = page.getByRole('banner');
  await navbar.getByRole('link', { name: 'Riesgo productivo' }).click();
  await expect(page.getByRole('heading', { name: 'Riesgo productivo' })).toBeVisible();
  await page.getByRole('button', { name: 'Cuenta' }).click();
  const menu = page.getByRole('menu');
  await expect(menu.getByRole('menuitem', { name: 'Restablecer contraseña' })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  // Not staff: no administration entry.
  await expect(menu.getByRole('menuitem', { name: 'Administrar usuarios' })).toHaveCount(0);

  // Cerrar sesión POSTs to the logout endpoint and brings the login gate back.
  const logoutRequest = page.waitForRequest(
    (request) => request.url().includes('/api/auth/logout/') && request.method() === 'POST',
  );
  await menu.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
  await logoutRequest;
  await expect(menu).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Riesgo productivo' })).toBeHidden();
});

test('staff reach Administrar usuarios from the user menu', async ({ page }) => {
  // Registered after the beforeEach stub, so it answers first: `/me` says staff.
  await stubAuth(page, { staff: true });
  await stubAdminUsers(page);
  await analyzeFirstPolygon(page);
  await loginFromHeader(page, 'admin@example.com');

  await page.getByRole('button', { name: 'Cuenta' }).click();
  await page.getByRole('menuitem', { name: 'Administrar usuarios' }).click();

  // The admin page: header, footer and the account list, one row per user.
  await expect(page).toHaveURL(/\/usuarios$/);
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();

  const table = page.getByRole('table');

  await expect(table.getByRole('columnheader')).toHaveText(['Email', 'Acciones']);

  for (const user of ADMIN_USERS) {
    // `exact`: the actions cell is named after its button, "Acciones de {email}".
    await expect(table.getByRole('cell', { name: user.email, exact: true })).toBeVisible();
  }
});

test('logs in from the header dialog', async ({ page }) => {
  await analyzeFirstPolygon(page);

  // The header's user button opens the login dialog; its
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
  await loginFromHeader(page);

  // …and unlocks riesgo productivo: no in-page gate, the private title shows.
  const navbar = page.getByRole('banner');
  await navbar.getByRole('link', { name: 'Riesgo productivo' }).click();
  await expect(page).toHaveURL(/\/analisis\/productivo/);
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Riesgo productivo' })).toBeVisible();

  // The productivo analysis runs once every filter has a value. Under Todas its widgets
  // read the whole selection: the base production bins both parcels' values on a 0–4 t/ha
  // scale (the "Numerical multiple" design; 3,55 and 3,81 fall in the 3,4–3,6 and 3,8–4
  // bins), the resilience proxy counts them per class (Widget03), and the thumbnail
  // prints the summed area. Soja is picked: the indicators follow the crop, and so do the
  // filters — the list is asked again for that crop.
  const filtersUrls: string[] = [];
  page.on('request', (request) => {
    const { pathname, search } = new URL(request.url());
    if (pathname === '/api/parcels/filters/') filtersUrls.push(pathname + search);
  });
  await page.getByRole('combobox', { name: 'Tipo de cultivo' }).click();
  await page.getByRole('option', { name: 'Soja' }).click();
  await expect
    .poll(() => filtersUrls)
    .toContain('/api/parcels/filters/?riesgo=productivo&crop_type=soy');
  const production = page
    .getByRole('heading', { name: 'Producción base histórica de soja' })
    .locator('..')
    .locator('..');
  await expect(production).toContainText('t/ha');
  await expect(production.getByRole('listitem')).toHaveText(['3,4 – 3,6: 1', '3,8 – 4: 1']);
  const resilience = page
    .getByRole('heading', { name: 'Proxy de resiliencia operativa' })
    .locator('..')
    .locator('..');
  await expect(resilience.getByRole('listitem').filter({ hasText: /^Media: 2$/ })).toHaveCount(1);
  await expect(page.getByText('17,5 ha').filter({ visible: true })).toBeVisible();
  // A short range (seasons detected, 0–8) is a count, not a risk: one bin per value on its
  // own scale, each parcel's value named outright.
  const seasons = page
    .getByRole('heading', { name: 'Contador de zafras de soja detectadas' })
    .locator('..')
    .locator('..');
  await expect(seasons.getByRole('listitem')).toHaveText(['3: 1', '5: 1']);

  // A parcel tab narrows the widgets to that parcel: its number as the number card's figure
  // (the "Numerical individual" design) — the range on its own 0–8 scale — its class on
  // the ruler. Back on Todas the histograms return.
  const parcelTabs = page.getByRole('group', { name: 'Parcela' }).getByRole('listitem');
  await parcelTabs.filter({ hasText: 'Parcela 2' }).getByRole('button').click();
  await expect(production.locator('[data-slot="figure"]')).toHaveText('3,81 t/ha');
  await expect(seasons.locator('[data-slot="figure"]')).toHaveText('3');
  await expect(seasons.getByText('8', { exact: true })).toBeVisible();
  await expect(resilience.locator('[data-slot="risk-level"]')).toHaveText('Media');
  await parcelTabs.filter({ hasText: 'Todas' }).getByRole('button').click();
  await expect(production.getByRole('listitem')).toHaveText(['3,4 – 3,6: 1', '3,8 – 4: 1']);

  // The arroz indicator is bound to the other crop (and came back "NA" besides): no widget,
  // and the picker does not offer it.
  await expect(
    page.getByRole('heading', { name: 'Producción base histórica de arroz' }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Personalizar indicadores' }).click();
  const checklist = page.getByRole('list', { name: 'Indicadores' });
  await expect(
    checklist.getByRole('checkbox', { name: 'Producción base histórica de soja' }),
  ).toBeVisible();
  await expect(
    checklist.getByRole('checkbox', { name: 'Producción base histórica de arroz' }),
  ).toHaveCount(0);
  await page.keyboard.press('Escape');

  await expect(page.getByRole('heading', { name: 'Resumen del análisis' })).toBeVisible();

  // Generar resumen POSTs the analysed parcels to the summary endpoint (stubbed to echo
  // them). The answer is held back so the generating state can be seen: the button reads
  // Generando and the description gives way to a placeholder.
  let releaseSummary!: () => void;
  const summaryHeld = new Promise<void>((resolve) => {
    releaseSummary = resolve;
  });
  await page.route(
    (url) => url.pathname === '/api/parcels/analysis/summary/',
    async (route) => {
      await summaryHeld;
      await route.fallback();
    },
  );

  const description = page.getByText('Puede añadir al informe un resumen');
  await expect(description).toBeVisible();
  await page.getByRole('button', { name: 'Generar resumen' }).click();
  await expect(page.getByRole('button', { name: 'Generando' })).toBeDisabled();
  await expect(description).toBeHidden();

  // Once it lands the text replaces the description and the button offers a retry.
  releaseSummary();
  await expect(page.getByRole('heading', { name: 'Resumen de 2 parcelas' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();

  // Signed in, the user button is the account menu, not the login dialog.
  await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Cuenta' }).click();
  await expect(page.getByRole('menuitem', { name: 'Cerrar sesión' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

// The report is the productivo page printed. The print dialog cannot be driven, so the
// click is checked by the file name it hands the browser (the document title at print
// time), and the report itself under print media: no nav, no footer, no buttons, the
// hero filters as plain information, and the browser able to render it to a PDF.
test('exports the productivo report as the page printed', async ({ page }) => {
  await analyzeFirstPolygon(page);
  await page.getByRole('banner').getByRole('link', { name: 'Riesgo productivo' }).click();
  await page.getByLabel('Email').fill('analista@example.com');
  await page.getByLabel('Contraseña').fill('cualquiera');
  await page.getByRole('button', { name: 'Acceder' }).click();
  await expect(page.getByRole('heading', { name: 'Riesgo productivo' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Tipo de cultivo' })).toBeEnabled();

  // A report printed mid-generation would go out without the summary: Exportar waits.
  const exportButton = page.getByRole('button', { name: 'Exportar informe' });
  await page.getByRole('button', { name: 'Generar resumen' }).click();
  await expect(exportButton).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
  await expect(exportButton).toBeEnabled();

  await page.evaluate(() => {
    window.print = () => {
      document.body.dataset.printedAs = document.title;
    };
  });
  await page.getByRole('button', { name: 'Exportar informe' }).click();
  await expect(page.locator('body')).toHaveAttribute(
    'data-printed-as',
    `agora-productivo-${TODAY}`,
  );

  await page.emulateMedia({ media: 'print' });

  await expect(page.getByRole('banner')).toBeHidden();
  await expect(page.getByRole('contentinfo')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Exportar informe' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Personalizar indicadores' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Generar resumen' })).toBeHidden();
  await expect(page.getByRole('combobox', { name: 'Tipo de cultivo' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Ver lista de parcelas' })).toBeHidden();

  // The info zone: each filter as "name — value", the parcels with their areas in place
  // of the tabs and the map, the date; the brand where the nav and footer were.
  const info = page.getByRole('main');
  await expect(info.getByRole('term').filter({ hasText: 'Tipo de cultivo' })).toBeVisible();
  await expect(info.getByRole('definition').filter({ hasText: /Arroz|Soja/ })).toBeVisible();
  await expect(info.getByRole('definition').filter({ hasText: '2026-09-17' })).toBeVisible();
  await expect(info.getByText('Informe generado el')).toBeVisible();
  await expect(info.getByRole('heading', { name: 'Resumen del análisis' })).toBeVisible();

  const table = info.getByRole('table', { name: 'Parcelas analizadas' });
  await expect(table.getByRole('row')).toHaveText([
    // Cell texts run together in a row's text, hence `\s*`.
    /Parcela\s*Área/,
    /Parcela 1\s*10,2 ha/,
    /Parcela 2\s*7,3 ha/,
    /Todas\s*17,5 ha/,
  ]);
  // Visible ones: the nav's and footer's logos are display-none, still in the DOM.
  await expect(page.getByText('LOGO').filter({ visible: true })).toHaveCount(2);
  await expect(info.getByRole('img', { name: 'Mapa de las parcelas analizadas' })).toBeVisible();

  // Paper is narrower than the screen (A4 is under the `md` breakpoint) and the page is
  // not re-measured for it: the title still prints, the summary takes the card's whole
  // width without its button, and a chart stays inside its card instead of keeping the
  // screen's width.
  await page.setViewportSize({ width: 794, height: 1123 });
  await expect(page.getByRole('heading', { name: 'Riesgo productivo' })).toBeVisible();
  const summary = info.getByRole('heading', { name: 'Resumen del análisis' }).locator('..');
  const summaryCard = summary.locator('..').locator('..');
  const [summaryBox, summaryCardBox] = await Promise.all([
    summary.boundingBox(),
    summaryCard.boundingBox(),
  ]);
  expect(summaryBox && summaryCardBox && summaryBox.width / summaryCardBox.width).toBeGreaterThan(
    0.85,
  );
  const chart = info.locator('svg[data-slot="chart"]').first();
  const chartCard = chart.locator('xpath=ancestor::*[@data-slot="card"][1]');
  const [chartBox, chartCardBox] = await Promise.all([
    chart.boundingBox(),
    chartCard.boundingBox(),
  ]);
  if (!chartBox || !chartCardBox) throw new Error('The chart or its card has no box');
  expect(chartBox.x + chartBox.width).toBeLessThanOrEqual(chartCardBox.x + chartCardBox.width);

  const pdf = await page.pdf({ format: 'A4' });
  expect(pdf.byteLength).toBeGreaterThan(1_000);

  // With a parcel's tab open the report follows it, like the widgets: that parcel and
  // its area on one line, no table, no total.
  await page.emulateMedia({ media: 'screen' });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page
    .getByRole('group', { name: 'Parcela' })
    .getByRole('listitem')
    .filter({ hasText: 'Parcela 1' })
    .getByRole('button')
    .click();
  await page.emulateMedia({ media: 'print' });
  await expect(table).toBeHidden();
  await expect(info.getByText(/^Parcela 1\s*10,2 ha$/)).toBeVisible();
  await expect(info.getByText('Todas')).toBeHidden();
});
