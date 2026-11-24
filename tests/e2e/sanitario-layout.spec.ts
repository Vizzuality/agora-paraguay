import { expect, test, type Locator, type Page } from '@playwright/test';

import { analyseOnRedesign } from './fixtures/redesign';

/** A local calendar day as the date fields write it, `offset` days from today. */
function isoDay(offset = 0): string {
  const now = new Date();
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
  const pad = (part: number) => String(part).padStart(2, '0');

  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

/** The date defaults: yesterday, and 1 October 2026 for sowing while that is earlier. */
const DEFAULT_DATE = isoDay(-1);
const DEFAULT_SOWING_DATE = '2026-10-01' < DEFAULT_DATE ? '2026-10-01' : isoDay(-2);

/** `YYYY-MM-DD` as the fields print it, `dd/mm/yyyy`. */
const ddmmyyyy = (iso: string) => iso.split('-').reverse().join('/');

/** Picks an ISO day in a date field's calendar through its month and year dropdowns. */
async function pickDate(page: Page, field: Locator, iso: string) {
  const [year, month] = iso.split('-').map(Number);
  await field.click();
  await page.getByRole('combobox', { name: 'Elegir el año' }).selectOption(String(year));
  await page.getByRole('combobox', { name: 'Elegir el mes' }).selectOption(String(month - 1));
  await page.locator(`[data-day="${iso}"] button`).click();
  await expect(field).toHaveAttribute('data-value', iso);
}

/** Opens Cultivo y fechas, where the analysis filters live. */
async function openFilters(page: Page) {
  const filters = page.getByRole('region', { name: 'Cultivo y fechas' });
  await filters.getByRole('button', { name: /Cultivo y fechas/ }).click();

  return filters;
}

/** Records the bodies of the sanitario analysis POSTs. */
function recordAnalyses(page: Page) {
  const bodies: { indicators: string[]; crop_type?: string }[] = [];
  page.on('request', (request) => {
    const { pathname } = new URL(request.url());
    if (pathname === '/api/parcels/analysis/diseases/' && request.method() === 'POST') {
      bodies.push(request.postDataJSON() as { indicators: string[]; crop_type?: string });
    }
  });

  return bodies;
}

function card(page: Page, name: string) {
  return page.getByRole('main').getByRole('heading', { name }).locator('..').locator('..');
}

test('Riesgo sanitario shows its widgets in the content column once analysed', async ({ page }) => {
  await analyseOnRedesign(page, '/analisis/sanitario');

  // Under Todas the disease card counts the parcels per class: indices 3 and 1 put one
  // parcel in Severo and one in Sin riesgo.
  const rust = card(page, 'Phakopsora pachyrhizi');
  await expect(rust).toContainText('Número de parcelas');
  await expect(rust.getByRole('listitem')).toHaveText([
    'Sin riesgo: 1',
    'Moderado: 0',
    'Severo: 1',
  ]);

  // The info tip sits in the card's top-right corner, inside its 24px padding.
  const tip = rust.getByRole('button', { name: 'Más información sobre Phakopsora pachyrhizi' });
  const tipBox = (await tip.boundingBox())!;
  const rustBox = (await rust.boundingBox())!;
  expect(Math.abs(rustBox.x + rustBox.width - 24 - (tipBox.x + tipBox.width))).toBeLessThan(1);
  expect(tipBox.y - rustBox.y).toBeLessThan(32);

  // Under Todas sanitario keeps its columns: the widget does not take the full width.
  const mainBox = (await page.getByRole('main').boundingBox())!;
  expect(rustBox.width).toBeLessThan(mainBox.width * 0.75);

  // The text facts share one context card.
  const info = page.getByRole('heading', { name: 'Información de contexto' }).locator('..');
  await expect(info).toContainText('Tipo de cultivo');
  await expect(info).toContainText('Soja');

  // Personalizar indicadores sits beside Exportar informe in the content column, as on
  // productivo, and no longer in the sidebar.
  const main = page.getByRole('main');
  await expect(
    main.getByRole('button', { name: 'Personalizar indicadores' }).first(),
  ).toBeVisible();
  await expect(main.getByRole('button', { name: 'Exportar informe' }).first()).toBeEnabled();
  const filters = await openFilters(page);
  await expect(filters.getByRole('button', { name: 'Personalizar indicadores' })).toHaveCount(0);
});

test('the report footer closes the printed dashboard only, naming the identifier', async ({
  page,
}) => {
  await analyseOnRedesign(page, '/analisis/sanitario');
  const types = page.getByRole('region', { name: 'ID y tipo de análisis' });
  await types.getByRole('button', { name: /ID y tipo de análisis/ }).click();
  await types.getByRole('textbox', { name: 'Identificador de análisis' }).fill('123456ABC');

  const main = page.getByRole('main');
  const footer = main.getByText(/^Resultados generados mediante la plataforma AGORA/);
  // Not on screen: it is the report's closing line.
  await expect(footer).toBeHidden();

  await page.emulateMedia({ media: 'print' });
  await expect(footer).toBeVisible();
  // The identifier and the date are the filled-in values, in italics.
  await expect(footer.locator('em').first()).toHaveText('123456ABC');
  await expect(footer.locator('em').last()).toHaveText(/^\d+ de \w+ de \d{4}$/);
});

test('the analysis runs with the default filters, and each change re-runs it', async ({ page }) => {
  const bodies = recordAnalyses(page);
  await analyseOnRedesign(page, '/analisis/sanitario');

  // One POST with soy and our default dates.
  await expect.poll(() => bodies.length).toBe(1);
  expect(bodies[0]).toMatchObject({
    crop_type: 'soja',
    sowing_date: DEFAULT_SOWING_DATE,
    date: DEFAULT_DATE,
  });
  expect(bodies[0].indicators).toContain('asian_rust');

  // Each page names its tab.
  await expect(page).toHaveTitle('Riesgo sanitario · AGORA');

  const filters = await openFilters(page);
  const cultivo = filters.getByRole('combobox', { name: 'Tipo de cultivo' });
  const sowingDate = filters.getByLabel('Fecha de siembra');
  const date = filters.getByRole('button', { name: /^Fecha \d/ });
  await expect(cultivo).toHaveText('Soja');
  await expect(sowingDate).toHaveText(ddmmyyyy(DEFAULT_SOWING_DATE));
  await expect(date).toHaveText(ddmmyyyy(DEFAULT_DATE));
  // A date field's name carries its date, so a screen reader reads what is picked.
  await expect(sowingDate).toHaveAccessibleName(
    `Fecha de siembra ${ddmmyyyy(DEFAULT_SOWING_DATE)}`,
  );

  // The calendar offers 1 September 2024 to today: nothing after today.
  await date.click();
  await expect(
    page.getByRole('combobox', { name: 'Elegir el año' }).locator('option').first(),
  ).toHaveText('2024');
  await expect(page.locator(`[data-day="${isoDay(1)}"] button`)).toBeDisabled();
  await page.keyboard.press('Escape');
  // The closing calendar stays mounted while it animates out; wait it off before the next.
  await expect(page.getByRole('dialog')).toBeHidden();

  await pickDate(page, sowingDate, '2026-05-01');
  await expect.poll(() => bodies.length).toBe(2);
  expect(bodies[1]).toMatchObject({ sowing_date: '2026-05-01' });

  await cultivo.click();
  await page.getByRole('option', { name: 'Arroz' }).click();
  await expect.poll(() => bodies.length).toBe(3);
  expect(bodies[2]).toMatchObject({ crop_type: 'rice' });
});

test('Personalizar indicadores drops an indicator from the analysis and its card', async ({
  page,
}) => {
  const bodies = recordAnalyses(page);
  await analyseOnRedesign(page, '/analisis/sanitario');
  await expect(card(page, 'Phakopsora pachyrhizi')).toBeVisible();

  await page
    .getByRole('main')
    .getByRole('button', { name: 'Personalizar indicadores' })
    .first()
    .click();
  const list = page.getByRole('list', { name: 'Indicadores' });
  await expect(list.getByRole('checkbox', { name: 'Phakopsora pachyrhizi' })).toBeChecked();
  // General info is always shown, so it is not in the list.
  await expect(list.getByRole('checkbox', { name: 'Tipo de cultivo' })).toHaveCount(0);

  // The search filters accent-insensitively.
  const search = page.getByRole('searchbox', { name: 'Buscar indicador' });
  await search.fill('phakopsora');
  await expect(list.getByRole('checkbox')).toHaveCount(1);
  await search.fill('');

  const before = bodies.length;
  await list.getByText('Phakopsora pachyrhizi').click();
  await page.keyboard.press('Escape');
  await expect.poll(() => bodies.length).toBe(before + 1);
  expect(bodies.at(-1)?.indicators).not.toContain('asian_rust');
  await expect(page.getByRole('heading', { name: 'Phakopsora pachyrhizi' })).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Información de contexto' })).toBeVisible();
});

test('says why when the indicator list cannot be loaded', async ({ page }) => {
  // The proxy's answer when the API is down, with the reason in the body.
  await analyseOnRedesign(page, '/analisis/sanitario', (target) =>
    target.route(
      (url) => url.pathname === '/api/parcels/indicators',
      (route) =>
        route.fulfill({
          status: 502,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'The API could not be reached.' }),
        }),
    ),
  );

  const reason = 'No se pudieron cargar los indicadores: The API could not be reached.';
  await expect(page.getByRole('alert').filter({ hasText: reason })).toBeVisible({
    timeout: 20_000,
  });
});

test('shows a loader while a filter change re-runs the analysis', async ({ page }) => {
  let release: () => void = () => {};
  let held = Promise.resolve();
  await analyseOnRedesign(page, '/analisis/sanitario', (target) =>
    target.route('**/api/parcels/analysis/diseases/', async (route) => {
      await held;
      await route.fallback();
    }),
  );

  const status = page.getByRole('status').filter({ hasText: /Analizando|Actualizando/ });
  await expect(card(page, 'Phakopsora pachyrhizi')).toBeVisible();
  await expect(status).toHaveCount(0);

  held = new Promise<void>((resolve) => (release = resolve));
  const filters = await openFilters(page);
  await filters.getByRole('combobox', { name: 'Tipo de cultivo' }).click();
  await page.getByRole('option', { name: 'Arroz' }).click();

  // The previous results stay on screen, inert, until the answer lands; no report of them.
  const exportReport = page
    .getByRole('main')
    .getByRole('button', { name: 'Exportar informe' })
    .first();
  await expect(status).toHaveText('Actualizando análisis…');
  await expect(page.locator('[aria-busy="true"]')).toContainText('Phakopsora pachyrhizi');
  await expect(exportReport).toBeDisabled();
  await expect(exportReport).toHaveAttribute(
    'title',
    'Espere a que terminen de cargar los indicadores',
  );
  release();
  await expect(status).toHaveCount(0);
  await expect(exportReport).toBeEnabled();
});

test('the first analysis waits in a bordered frame that ends inside the window, under the actions', async ({
  page,
}) => {
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => (release = resolve));
  await analyseOnRedesign(page, '/analisis/sanitario', (target) =>
    target.route('**/api/parcels/analysis/diseases/', async (route) => {
      await held;
      await route.fallback();
    }),
  );

  const status = page.getByRole('status').filter({ hasText: 'Analizando…' });
  await expect(status).toBeVisible();
  // Nothing to report yet: Exportar informe waits for the indicators.
  const exportReport = page
    .getByRole('main')
    .getByRole('button', { name: 'Exportar informe' })
    .first();
  await expect(exportReport).toBeDisabled();
  await expect(status).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(status).toHaveCSS('border-top-width', '3px');
  // The actions sit above it: its bottom on the content column's 40px padding.
  const viewport = page.viewportSize()!;
  const box = (await status.boundingBox())!;
  expect(Math.abs(box.y + box.height - (viewport.height - 40))).toBeLessThan(2);

  release();
  await expect(status).toHaveCount(0);
  await expect(exportReport).toBeEnabled();
});

test('the login backdrop dims the widgets as well as the sidebar', async ({ page }) => {
  await analyseOnRedesign(page, '/analisis/sanitario');
  const rust = card(page, 'Phakopsora pachyrhizi');
  await expect(rust).toBeVisible();

  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  const login = page.getByRole('dialog', { name: 'Iniciar sesión' });
  await expect(login).toBeVisible();

  // Probe a corner of the widget the centred card does not cover: the backdrop paints there.
  const box = (await rust.boundingBox())!;
  const dialog = (await login.boundingBox())!;
  const outsideDialog = ([x, y]: number[]) =>
    x < dialog.x || x > dialog.x + dialog.width || y < dialog.y || y > dialog.y + dialog.height;
  const point = [
    [box.x + 8, box.y + 8],
    [box.x + box.width - 8, box.y + 8],
    [box.x + 8, box.y + box.height - 8],
    [box.x + box.width - 8, box.y + box.height - 8],
  ].find(outsideDialog);
  expect(point).toBeDefined();

  const topmost = await page.evaluate(
    ([x, y]) => document.elementFromPoint(x, y)?.getAttribute('data-slot'),
    point!,
  );
  expect(topmost).toBe('login-backdrop');
});

test('Exportar informe prints sanitario as its report, the map as an image', async ({ page }) => {
  // The dialog itself is the browser's: the report is checked in the paper layout before it.
  await page.addInitScript(() => {
    window.print = () => {};
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await analyseOnRedesign(page, '/analisis/sanitario');
  await expect(card(page, 'Phakopsora pachyrhizi')).toBeVisible();

  const main = page.getByRole('main');
  await main.getByRole('button', { name: 'Exportar informe' }).first().click();
  await expect(page.locator('html.paper-layout')).toHaveCount(1);
  await expect(page).toHaveTitle(/^agora-sanitario-\d{4}-\d{2}-\d{2}$/);

  // The settings stack above the content, which takes the paper's width.
  const settings = page.getByRole('complementary', { name: 'Configuración' });
  await expect.poll(async () => (await main.boundingBox())!.width).toBeGreaterThan(700);
  expect((await settings.boundingBox())!.y).toBeLessThan((await main.boundingBox())!.y);

  // On paper the área's map prints from an image in Parámetros del análisis (print-only,
  // so checked in print media), in place of the settings; the actions stay off the paper.
  await page.emulateMedia({ media: 'print' });
  await expect(settings.getByRole('region', { name: 'Área de interés' })).toBeHidden();
  await expect(
    main
      .getByRole('region', { name: 'Parámetros del análisis' })
      .locator('img[src^="data:image/png"]'),
  ).toBeVisible();
  await expect(main.getByRole('button', { name: 'Exportar informe' }).first()).toBeHidden();
  await expect(main.getByRole('button', { name: 'Personalizar indicadores' }).first()).toBeHidden();
  await expect(card(page, 'Phakopsora pachyrhizi')).toBeVisible();
  // The footer says where, for which analysis and when; no identifier was given.
  await expect(
    main.getByText(
      /^Resultados generados mediante la plataforma AGORA para este análisis, el \d+ de \w+ de \d{4}\.$/,
    ),
  ).toBeVisible();
});

test('the report is titled, with its Identificador de análisis once one is entered', async ({
  page,
}) => {
  await analyseOnRedesign(page, '/analisis/sanitario');
  // The title row: not the hidden <h1>, nor the info card that shares its text.
  const row = page.locator('[data-slot="report-title"]');
  const title = row.locator('p', { hasText: /^Riesgo sanitario$/ });

  // On screen the heading stays hidden: the title row is the report's.
  await expect(title).toBeHidden();

  // None entered: on paper the title stands alone.
  await page.emulateMedia({ media: 'print' });
  await expect(title).toBeVisible();
  await expect(row.getByRole('term')).toHaveCount(0);
  // The report opens on it: first of the settings column, which prints before the content,
  // on the first page, with no break before it to leave that page blank.
  const settings = page.getByRole('complementary', { name: 'Configuración' });
  await expect(settings.locator(':scope > *').first()).toHaveAttribute('data-slot', 'report-title');
  await expect(row).toHaveCSS('break-before', 'auto');

  await page.emulateMedia({ media: 'screen' });
  const types = page.getByRole('region', { name: 'ID y tipo de análisis' });
  await types.getByRole('button', { name: /ID y tipo de análisis/ }).click();
  await types.getByRole('textbox', { name: 'Identificador de análisis' }).fill('123456ABC');

  await page.emulateMedia({ media: 'print' });
  await expect(row.getByRole('term')).toHaveText('Identificador de análisis');
  await expect(row.getByRole('definition')).toHaveText('123456ABC');
});
