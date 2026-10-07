import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

import { stubAnalysisApi } from './fixtures/api';
import { stubBasemap } from './fixtures/map';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'uploads');

// A phone: below the `md` breakpoint, where the nav links move under the bar.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test.beforeEach(async ({ page }) => {
  await stubBasemap(page);
  await stubAnalysisApi(page);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Subir archivo' })).toBeEnabled();
  await page.locator('input[type="file"]').setInputFiles(join(FIXTURES, 'farms.geojson'));
  await page.getByRole('button', { name: 'Analizar' }).click();
  await expect(page).toHaveURL(/\/analisis\/sanitario/);
});

test('the nav links sit under the bar, once each, and the risk tabs switch pages', async ({
  page,
}) => {
  const navbar = page.getByRole('banner');

  await expect(navbar.getByRole('link', { name: 'Selección de parcelas' })).toHaveCount(1);
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

test('the hero and the title row actions fit the width', async ({ page }) => {
  const parcels = page.getByRole('group', { name: 'Parcela' }).getByRole('listitem');
  await expect(parcels).toHaveText(['Todas', 'Parcela 1', 'Parcela 2']);

  await expect(page.getByRole('button', { name: 'Personalizar indicadores' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Exportar informe' })).toBeVisible();

  await page.getByRole('button', { name: 'Personalizar indicadores' }).click();
  await expect(page.getByRole('checkbox').first()).toBeVisible();
});
