import { expect, test } from '@playwright/test';

import { stubAuth } from './fixtures/auth';
import { stubBasemap } from './fixtures/map';

test.beforeEach(async ({ page }) => {
  await stubBasemap(page);
  await stubAuth(page);
});

test('an unknown URL gets the 404 page, bare, with a way back', async ({ page }) => {
  const response = await page.goto('/esta-pagina-no-existe');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible();
  await expect(page.getByRole('banner')).toHaveCount(0);
  await expect(page.getByRole('contentinfo')).toHaveCount(0);

  await page.getByRole('link', { name: 'Volver al inicio' }).click();
  // `/` opens the first screen: Exposición climática, the analysis types open.
  await expect(page).toHaveURL(/\/analisis\/exposicion-climatica$/);
  await expect(
    page.getByRole('region', { name: 'Tipo de análisis' }).getByRole('button', {
      name: /Tipo de análisis/,
    }),
  ).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText('Seleccione un distrito en el mapa')).toBeVisible();
});
