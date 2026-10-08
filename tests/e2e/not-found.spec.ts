import { expect, test } from '@playwright/test';

import { stubAuth } from './fixtures/auth';
import { stubBasemap } from './fixtures/map';

test.beforeEach(async ({ page }) => {
  await stubBasemap(page);
  await stubAuth(page);
});

test('an unknown URL gets the 404 page, with the nav, the footer and a way back', async ({
  page,
}) => {
  const response = await page.goto('/esta-pagina-no-existe');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible();
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();

  await page.getByRole('link', { name: 'Volver al inicio' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('button', { name: 'Subir archivo' })).toBeVisible();
});
