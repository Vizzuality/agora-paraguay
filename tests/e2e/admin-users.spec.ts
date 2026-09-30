import { expect, test, type Page } from '@playwright/test';

import { ADMIN_USERS, RESET_TOKEN, stubAdminUsers, stubAuth } from './fixtures/auth';

/** Signs in through the gate card `/usuarios` shows to an anonymous visitor. */
async function loginAtGate(page: Page) {
  await page.getByLabel('Usuario o email').fill('admin');
  await page.getByLabel('Contraseña').fill('cualquiera');
  await page.getByRole('button', { name: 'Acceder' }).click();
  await expect(page.getByRole('table')).toBeVisible();
}

function dialog(page: Page) {
  return page.getByRole('dialog', { name: 'Añadir usuario' });
}

test.beforeEach(async ({ page }) => {
  await stubAuth(page, { staff: true });
});

test('an administrator adds a user and gets the link to pass on; the list shows the account', async ({
  page,
}) => {
  await stubAdminUsers(page);
  await page.goto('/usuarios');
  await loginAtGate(page);

  // Two Añadir usuario buttons, above and below the list, one dialog.
  await expect(page.getByRole('button', { name: 'Añadir usuario' })).toHaveCount(2);
  await page.getByRole('button', { name: 'Añadir usuario' }).first().click();

  const form = dialog(page);

  await expect(form).toBeVisible();
  await form.getByLabel('Nombre de usuario').fill('nueva');
  await form.getByLabel('Email').fill('nueva@example.com');
  await form.getByRole('button', { name: 'Añadir' }).click();

  const done = page.getByRole('dialog', { name: 'Usuario creado' });

  await expect(done).toBeVisible();
  await expect(done.getByRole('link', { name: new RegExp(RESET_TOKEN) })).toBeVisible();

  await done.getByRole('button', { name: 'Cerrar' }).click();
  await expect(done).toBeHidden();

  // The list was refreshed: the new account sits in the API's order.
  const rows = page.getByRole('table').getByRole('row');

  await expect(rows).toHaveCount(1 + ADMIN_USERS.length + 1);
  await expect(
    page.getByRole('row', { name: /nueva/ }).getByRole('cell', { name: 'nueva@example.com' }),
  ).toBeVisible();
});

test('Cancelar closes the form, and the API refusal is quoted on it', async ({ page }) => {
  await stubAdminUsers(page, {
    // A `detail` body; DRF field errors (`{ username: [...] }`) read as the reason once the
    // transport change on the password-reset branch lands.
    createFailure: {
      status: 400,
      body: { detail: 'Ya existe un usuario con ese nombre.' },
    },
  });
  await page.goto('/usuarios');
  await loginAtGate(page);

  await page.getByRole('button', { name: 'Añadir usuario' }).last().click();
  await dialog(page).getByRole('button', { name: 'Cancelar' }).click();
  await expect(dialog(page)).toBeHidden();

  await page.getByRole('button', { name: 'Añadir usuario' }).first().click();
  await dialog(page).getByLabel('Nombre de usuario').fill('admin');
  await dialog(page).getByLabel('Email').fill('admin@example.com');
  await dialog(page).getByRole('button', { name: 'Añadir' }).click();

  await expect(dialog(page).getByRole('alert')).toHaveText('Ya existe un usuario con ese nombre.');
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(1 + ADMIN_USERS.length);
});
