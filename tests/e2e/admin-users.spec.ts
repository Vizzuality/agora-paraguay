import { expect, test, type Page } from '@playwright/test';

import { ADMIN_USERS, RESET_TOKEN, stubAdminUsers, stubAuth } from './fixtures/auth';

/**
 * Signs in through the gate card `/usuarios` shows to an anonymous visitor. The
 * server-rendered card is disabled until hydration, so the fills and the click wait for
 * the client's card rather than typing into a form about to be replaced.
 */
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

/** The row's three-dots menu, opened. */
async function openActions(page: Page, username: string) {
  await page.getByRole('button', { name: `Acciones de ${username}` }).click();

  return page.getByRole('menu');
}

test('the row menu deletes an account after confirming; the list drops it', async ({ page }) => {
  await stubAdminUsers(page);
  await page.goto('/usuarios');
  await loginAtGate(page);

  const menu = await openActions(page, 'analista');

  await expect(menu.getByRole('menuitem')).toHaveText(['Restablecer contraseña', 'Borrar cuenta']);
  await menu.getByRole('menuitem', { name: 'Borrar cuenta' }).click();

  const confirm = page.getByRole('alertdialog', { name: '¿Borrar la cuenta de analista?' });

  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Borrar' }).click();
  await expect(confirm).toBeHidden();

  await expect(page.getByRole('table').getByRole('row')).toHaveCount(1 + ADMIN_USERS.length - 1);
  await expect(page.getByRole('row', { name: /analista/ })).toHaveCount(0);
});

test('Cancelar keeps the account, and the API refusal is quoted in the confirm dialog', async ({
  page,
}) => {
  await stubAdminUsers(page, {
    deleteFailure: { status: 400, body: { detail: 'No puedes eliminar tu propia cuenta.' } },
  });
  await page.goto('/usuarios');
  await loginAtGate(page);

  const confirm = page.getByRole('alertdialog', { name: '¿Borrar la cuenta de admin?' });

  await (await openActions(page, 'admin')).getByRole('menuitem', { name: 'Borrar cuenta' }).click();
  await confirm.getByRole('button', { name: 'Cancelar' }).click();
  await expect(confirm).toBeHidden();
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(1 + ADMIN_USERS.length);

  await (await openActions(page, 'admin')).getByRole('menuitem', { name: 'Borrar cuenta' }).click();
  await confirm.getByRole('button', { name: 'Borrar' }).click();

  await expect(confirm.getByRole('alert')).toHaveText('No puedes eliminar tu propia cuenta.');
  await expect(confirm).toBeVisible();
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(1 + ADMIN_USERS.length);
});

test('Restablecer contraseña logs the stub until the endpoint exists', async ({ page }) => {
  await stubAdminUsers(page);
  const logged: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'info') logged.push(message.text());
  });

  await page.goto('/usuarios');
  await loginAtGate(page);

  const menu = await openActions(page, 'analista');

  await menu.getByRole('menuitem', { name: 'Restablecer contraseña' }).click();
  await expect(menu).toBeHidden();
  await expect.poll(() => logged.some((text) => /analista/.test(text))).toBe(true);
});
