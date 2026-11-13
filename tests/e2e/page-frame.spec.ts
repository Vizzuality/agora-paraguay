import { expect, test, type Page } from '@playwright/test';

import { stubAuth } from './fixtures/auth';

async function login(page: Page) {
  // Until hydration the account button is its inert fallback; the theme switch's
  // placeholder is disabled, so an enabled one means the real buttons are mounted.
  await expect(page.getByRole('button', { name: 'Cambiar tema' })).toBeEnabled();
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  const dialog = page.getByRole('dialog', { name: 'Iniciar sesión' });
  await dialog.getByLabel('Email').fill('analista@example.com');
  await dialog.getByLabel('Contraseña').fill('cualquiera');
  await dialog.getByRole('button', { name: 'Acceder' }).click();
  await expect(dialog).toBeHidden();
}

test('the settings column sits left of the content, 552px wide', async ({ page }) => {
  await stubAuth(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/analisis');

  const banner = page.getByRole('banner');
  const settings = page.getByRole('complementary', { name: 'Configuración' });
  const main = page.getByRole('main');

  await expect(banner.getByRole('link', { name: 'Inicio' })).toBeVisible();
  await expect(banner.getByRole('button', { name: 'Cambiar tema' })).toBeEnabled();
  await expect(banner.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();

  const settingsBox = await settings.boundingBox();
  const mainBox = await main.boundingBox();

  expect(settingsBox?.width).toBe(552);
  expect(mainBox!.x).toBeGreaterThan(settingsBox!.x + settingsBox!.width);
});

test('below lg the columns stack, settings first', async ({ page }) => {
  await stubAuth(page);
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/analisis');

  const settingsBox = await page
    .getByRole('complementary', { name: 'Configuración' })
    .boundingBox();
  const mainBox = await page.getByRole('main').boundingBox();

  expect(mainBox!.y).toBeGreaterThanOrEqual(settingsBox!.y + settingsBox!.height);
});

test('signed in, the account menu names the user and closes the session', async ({ page }) => {
  await stubAuth(page);
  await page.goto('/analisis');
  await login(page);

  await page.getByRole('button', { name: 'Cuenta' }).click();
  const menu = page.getByRole('menu');

  await expect(menu.getByText('Ana Lista')).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Restablecer contraseña' })).toHaveCount(0);
  // Not staff: no administration entry.
  await expect(menu.getByRole('menuitem', { name: 'Administrar usuarios' })).toHaveCount(0);

  await menu.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
  await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
});

test('staff find Administrar usuarios in the account menu', async ({ page }) => {
  await stubAuth(page, { staff: true });
  await page.goto('/analisis');
  await login(page);

  await page.getByRole('button', { name: 'Cuenta' }).click();

  await expect(page.getByRole('menuitem', { name: 'Administrar usuarios' })).toHaveAttribute(
    'href',
    '/usuarios',
  );
});
