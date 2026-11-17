import { expect, test, type Page } from '@playwright/test';

import { stubAuth } from './fixtures/auth';

async function login(page: Page) {
  // Until hydration the account button is its inert fallback; the theme switch's
  // placeholder is disabled, so an enabled one means the real buttons are mounted.
  await expect(page.getByRole('button', { name: 'Cambiar tema' })).toBeEnabled();
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  const dialog = page.getByRole('dialog', { name: 'Área privada' });
  await dialog.getByLabel('Email').fill('analista@example.com');
  await dialog.getByLabel('Contraseña').fill('cualquiera');
  await dialog.getByRole('button', { name: 'Acceder' }).click();
  await expect(dialog).toBeHidden();
}

test('at 1280 the settings and the content split in halves, settings on the left', async ({
  page,
}) => {
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

  // 592 = (1280 − 2 × 40 padding − 16 gap) / 2.
  expect(settingsBox?.width).toBe(592);
  expect(mainBox?.width).toBe(592);
  expect(mainBox!.x).toBeGreaterThan(settingsBox!.x + settingsBox!.width);
});

test('past 1280 the columns stop growing and centre', async ({ page }) => {
  await stubAuth(page);
  await page.setViewportSize({ width: 1600, height: 800 });
  await page.goto('/analisis');

  const settingsBox = await page
    .getByRole('complementary', { name: 'Configuración' })
    .boundingBox();
  const mainBox = await page.getByRole('main').boundingBox();

  expect(settingsBox?.width).toBe(592);
  expect(mainBox?.width).toBe(592);
  // (1600 − 1280) / 2 margin, then the 40px padding.
  expect(settingsBox?.x).toBe(200);
});

test('below 1280 the content keeps its width and the settings column narrows', async ({ page }) => {
  await stubAuth(page);
  await page.goto('/analisis');

  // 592 = the content's half at 1280.
  for (const width of [1280, 1152, 1024]) {
    await page.setViewportSize({ width, height: 800 });
    const settingsBox = await page
      .getByRole('complementary', { name: 'Configuración' })
      .boundingBox();
    const mainBox = await page.getByRole('main').boundingBox();

    expect(mainBox!.width).toBe(592);
    expect(settingsBox!.width).toBe(width - 80 - 16 - 592);
  }
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
