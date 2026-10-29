import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test, type Locator, type Page } from '@playwright/test';

import { stubAnalysisApi } from './fixtures/api';
import { stubBasemap } from './fixtures/map';
import { pickAnalysisType } from './fixtures/selection';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'uploads');

// A phone: below the `md` breakpoint, where the nav links move under the bar.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test.beforeEach(async ({ page }) => {
  await stubBasemap(page);
  await stubAnalysisApi(page);
  await page.goto('/');
  await pickAnalysisType(page);
  await expect(page.getByRole('button', { name: 'Subir archivo' })).toBeEnabled();
  await page.locator('input[type="file"]').setInputFiles(join(FIXTURES, 'farms.geojson'));
  await page.getByRole('button', { name: 'Analizar' }).click();
  await expect(page).toHaveURL(/\/analisis\/sanitario/);
});

test('the nav links sit under the bar, once each, and the risk tabs switch pages', async ({
  page,
}) => {
  const navbar = page.getByRole('banner');

  await expect(navbar.getByRole('link', { name: 'Personalización del análisis' })).toHaveCount(1);
  await expect(navbar.getByRole('link', { name: 'Exposición climática' })).toHaveCount(1);
  await expect(navbar.getByRole('link', { name: 'Riesgo sanitario' })).toHaveCount(1);
  await expect(navbar.getByRole('link', { name: 'Riesgo productivo' })).toBeVisible();
  await expect(navbar.getByRole('button', { name: 'Cambiar tema' })).toBeVisible();

  // The page fits the phone: nothing scrolls sideways.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);

  await navbar.getByRole('link', { name: 'Riesgo productivo' }).click();
  await expect(page).toHaveURL(/\/analisis\/productivo/);
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
});

/** No sideways scroll, and the box sits inside the 8px gutters of a 390px screen. */
async function expectFitsPhone(page: Page, box: Locator) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);

  // Polled: the popover zooms in, so its box grows until the animation ends.
  await expect.poll(async () => Math.round((await box.boundingBox())?.width ?? 0)).toBe(374);
  expect(Math.round((await box.boundingBox())?.x ?? 0)).toBe(8);
}

test('the login card of riesgo productivo fits the width', async ({ page }) => {
  await page.getByRole('banner').getByRole('link', { name: 'Riesgo productivo' }).click();

  const form = page
    .locator('main form')
    .filter({ has: page.getByRole('heading', { name: 'Iniciar sesión' }) });
  await expect(form).toBeVisible();

  await expectFitsPhone(page, form);
});

test('the header login popover fits the width', async ({ page }) => {
  await page.getByRole('banner').getByRole('button', { name: 'Iniciar sesión' }).click();

  await expectFitsPhone(page, page.getByRole('dialog', { name: 'Iniciar sesión' }));
});

test('the hero and the title row actions fit the width', async ({ page }) => {
  const parcels = page.getByRole('group', { name: 'Parcela' }).getByRole('listitem');
  await expect(parcels).toHaveText(['Todas', 'Parcela 1', 'Parcela 2']);

  await expect(page.getByRole('button', { name: 'Personalizar indicadores' })).toBeVisible();
  // Sanitario has no report: the picker is the only action on the row.
  await expect(page.getByRole('button', { name: 'Exportar informe' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Personalizar indicadores' }).click();
  await expect(page.getByRole('checkbox').first()).toBeVisible();
});
