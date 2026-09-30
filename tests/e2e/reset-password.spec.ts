import { expect, test, type Page } from '@playwright/test';

import { stubAuth } from './fixtures/auth';

/** A well-formed token; whether it is "valid" is the stub's decision, per test. */
const TOKEN = '3f2c1a0e-9b7d-4c6a-8e5f-1234567890ab';

/**
 * Stubs the two reset endpoints: the check answers `valid`, the confirm answers `confirm`
 * (200 with a detail by default). Records the confirm body for assertions.
 */
async function stubResetPassword(
  page: Page,
  { valid = true, confirm }: { valid?: boolean; confirm?: { status: number; body: unknown } } = {},
) {
  const posted: unknown[] = [];

  await page.route('**/api/auth/reset-password/check/*/', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify({ valid }) }),
  );
  await page.route('**/api/auth/reset-password/confirm/', async (route) => {
    posted.push(route.request().postDataJSON());

    const answer = confirm ?? { status: 200, body: { detail: 'Password reset successfully.' } };

    await route.fulfill({
      status: answer.status,
      contentType: 'application/json',
      body: JSON.stringify(answer.body),
    });
  });

  return posted;
}

function card(page: Page) {
  return {
    password: page.getByLabel('Nueva contraseña', { exact: true }),
    confirmation: page.getByLabel('Repetir nueva contraseña'),
    save: page.getByRole('button', { name: 'Guardar contraseña' }),
    alert: page.getByRole('alert'),
  };
}

test.beforeEach(async ({ page }) => {
  await stubAuth(page);
});

test('a valid link shows the form; saving a good password confirms and offers the login', async ({
  page,
}) => {
  const posted = await stubResetPassword(page);

  await page.goto(`/restablecer-contrasena/${TOKEN}`);
  await expect(page.getByRole('heading', { name: 'Nueva contraseña' })).toBeVisible();

  const { password, confirmation, save } = card(page);

  await password.fill('Chaco-2026!');
  await confirmation.fill('Chaco-2026!');
  await save.click();

  await expect(page.getByRole('heading', { name: 'Contraseña actualizada' })).toBeVisible();
  expect(posted).toEqual([{ token: TOKEN, new_password: 'Chaco-2026!' }]);

  await page.getByRole('link', { name: 'Iniciar sesión' }).click();
  await expect(page).toHaveURL(/\/(\?.*)?$/);
});

test('mismatched or weak passwords are refused before any request', async ({ page }) => {
  const posted = await stubResetPassword(page);

  await page.goto(`/restablecer-contrasena/${TOKEN}`);

  const { password, confirmation, save, alert } = card(page);

  await password.fill('Chaco-2026!');
  await confirmation.fill('Chaco-2027!');
  await save.click();
  await expect(alert).toHaveText('Las contraseñas no coinciden.');

  await password.fill('1234');
  await confirmation.fill('1234');
  await save.click();
  await expect(alert).toContainText('demasiado corta');
  await expect(alert).toContainText('completamente numérica');

  expect(posted).toEqual([]);
});

test("the backend's refusal is quoted on the card", async ({ page }) => {
  await stubResetPassword(page, {
    confirm: { status: 400, body: { new_password: ['Esta contraseña es demasiado común.'] } },
  });

  await page.goto(`/restablecer-contrasena/${TOKEN}`);

  const { password, confirmation, save, alert } = card(page);

  await password.fill('Chaco-2026!');
  await confirmation.fill('Chaco-2026!');
  await save.click();

  await expect(alert).toHaveText('Esta contraseña es demasiado común.');
  await expect(page.getByRole('heading', { name: 'Nueva contraseña' })).toBeVisible();
});

test('a spent link and a malformed one both land on the invalid-link card', async ({ page }) => {
  await stubResetPassword(page, { valid: false });

  await page.goto(`/restablecer-contrasena/${TOKEN}`);
  await expect(page.getByRole('heading', { name: 'Enlace no válido' })).toBeVisible();

  let checked = false;
  await page.route('**/api/auth/reset-password/check/**', (route) => {
    checked = true;

    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ valid: true }),
    });
  });

  await page.goto('/restablecer-contrasena/not-a-token');
  await expect(page.getByRole('heading', { name: 'Enlace no válido' })).toBeVisible();
  expect(checked).toBe(false);
});
