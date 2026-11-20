import { expect, test } from '@playwright/test';

import { stubAuth } from './fixtures/auth';

test('the login dialog explains what an account is for and closes from its ×', async ({ page }) => {
  await stubAuth(page);
  await page.goto('/analisis');
  await expect(page.getByRole('button', { name: 'Cambiar tema' })).toBeEnabled();

  await page.getByRole('banner').getByRole('button', { name: 'Iniciar sesión' }).click();
  const dialog = page.getByRole('dialog', { name: 'Iniciar sesión' });
  // The card's heading; the dialog's own title, before it, is the screen-reader name.
  await expect(dialog.getByRole('heading', { name: 'Iniciar sesión' }).last()).toBeVisible();
  await expect(dialog).toContainText('no crea un historial');
  await expect(dialog.getByRole('button', { name: 'Restablecer contraseña' })).toBeVisible();

  await dialog.getByRole('button', { name: 'Cerrar' }).click();
  await expect(dialog).toBeHidden();
});
