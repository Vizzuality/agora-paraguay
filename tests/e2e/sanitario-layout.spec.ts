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

/** Opens Cultivo y fechas, where the filters and Personalizar indicadores live on sanitario. */
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

  // The text facts share one summary card.
  const info = page.getByRole('heading', { name: 'Resumen del análisis' }).locator('..');
  await expect(info).toContainText('Tipo de cultivo');
  await expect(info).toContainText('Soja');

  // Personalizar indicadores closes the Cultivo y fechas section on sanitario.
  const filters = await openFilters(page);
  await expect(filters.getByRole('button', { name: 'Personalizar indicadores' })).toBeVisible();
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

  const filters = await openFilters(page);
  const cultivo = filters.getByRole('combobox', { name: 'Tipo de cultivo' });
  const sowingDate = filters.getByLabel('Fecha de siembra');
  const date = filters.getByLabel('Fecha', { exact: true });
  await expect(cultivo).toHaveText('Soja');
  await expect(sowingDate).toHaveText(ddmmyyyy(DEFAULT_SOWING_DATE));
  await expect(date).toHaveText(ddmmyyyy(DEFAULT_DATE));

  // The calendar offers 1 September 2024 to today: nothing after today.
  await date.click();
  await expect(
    page.getByRole('combobox', { name: 'Elegir el año' }).locator('option').first(),
  ).toHaveText('2024');
  await expect(page.locator(`[data-day="${isoDay(1)}"] button`)).toBeDisabled();
  await page.keyboard.press('Escape');

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

  const filters = await openFilters(page);
  await filters.getByRole('button', { name: 'Personalizar indicadores' }).click();
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
  await expect(page.getByRole('heading', { name: 'Resumen del análisis' })).toBeVisible();
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

  // The previous results stay on screen, inert, until the answer lands.
  await expect(status).toHaveText('Actualizando análisis…');
  await expect(page.locator('[aria-busy="true"]')).toContainText('Phakopsora pachyrhizi');
  release();
  await expect(status).toHaveCount(0);
});
