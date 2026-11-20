import { expect, test } from '@playwright/test';

import { stubAuth } from './fixtures/auth';

test('Acerca de opens what AGORA is and what each module covers, and closes again', async ({
  page,
}) => {
  await stubAuth(page);
  await page.goto('/analisis');
  // Hydrated once the theme switch's disabled placeholder has been replaced.
  await expect(page.getByRole('button', { name: 'Cambiar tema' })).toBeEnabled();

  await page.getByRole('banner').getByRole('button', { name: 'Acerca de' }).click();

  const dialog = page.getByRole('dialog', { name: 'Acerca de AGORA' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('plataforma geoespacial agrícola');
  await expect(dialog.getByRole('heading', { name: 'Acceso y cobertura' })).toBeVisible();

  await dialog.getByRole('button', { name: 'Cerrar' }).click();
  await expect(dialog).toBeHidden();
});
