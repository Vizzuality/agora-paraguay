import { expect, test } from '@playwright/test';

import { stubAuth } from './fixtures/auth';

test.beforeEach(async ({ page }) => {
  await stubAuth(page);
  await page.goto('/analisis');
  // Hydrated once the theme switch's disabled placeholder has been replaced.
  await expect(page.getByRole('button', { name: 'Cambiar tema' })).toBeEnabled();
});

test('ID y tipo de análisis names the open type and switches between them', async ({ page }) => {
  // Bare /analisis lands on Exposición climática.
  await expect(page).toHaveURL(/\/analisis\/exposicion-climatica$/);

  const section = page.getByRole('region', { name: 'ID y tipo de análisis' });
  const heading = section.getByRole('button', { name: /ID y tipo de análisis/ });

  // Closed, the heading carries the current choice.
  await expect(heading).toHaveAttribute('aria-expanded', 'false');
  await expect(heading).toContainText('Exposición climática');
  await heading.click();

  const types = section.getByRole('navigation', { name: 'Tipo de análisis' }).getByRole('link');
  await expect(types).toHaveText(['Exposición climática', 'Riesgo sanitario', 'Riesgo productivo']);
  await expect(types.filter({ hasText: 'Exposición climática' })).toHaveAttribute(
    'aria-current',
    'page',
  );

  // Choosing navigates, closes the section, and the closed heading carries the choice.
  await types.filter({ hasText: 'Riesgo sanitario' }).click();
  await expect(page).toHaveURL(/\/analisis\/sanitario$/);
  await expect(heading).toHaveAttribute('aria-expanded', 'false');
  await expect(heading).toContainText('Riesgo sanitario');

  await heading.click();
  await types.filter({ hasText: 'Exposición climática' }).click();
  await expect(page).toHaveURL(/\/analisis\/exposicion-climatica$/);
  await expect(heading).toHaveAttribute('aria-expanded', 'false');
  await expect(heading).toContainText('Exposición climática');
});

test('the logo goes to the landing, whose cards lead to each analysis', async ({ page }) => {
  const section = page.getByRole('region', { name: 'ID y tipo de análisis' });
  await section.getByRole('button', { name: /ID y tipo de análisis/ }).click();
  await section.getByRole('link', { name: 'Riesgo sanitario' }).click();

  await page.getByRole('banner').getByRole('link', { name: 'Inicio' }).click();
  await expect(page).toHaveURL(/\/$/);
  const cards = page.getByRole('navigation', { name: 'Tipos de análisis' }).getByRole('link');
  await expect(cards).toHaveCount(3);
  await expect(cards.first()).toContainText('Saber más');

  await cards.filter({ hasText: 'Riesgo sanitario' }).click();
  await expect(page).toHaveURL(/\/analisis\/sanitario/);
});

test('closed, ID y tipo de análisis carries the identifier before the type', async ({ page }) => {
  const section = page.getByRole('region', { name: 'ID y tipo de análisis' });
  const heading = section.getByRole('button', { name: /ID y tipo de análisis/ });

  await heading.click();
  await section.getByRole('textbox', { name: 'Identificador de análisis' }).fill('123456ABC');
  await heading.click();

  await expect(heading).toHaveAttribute('aria-expanded', 'false');
  await expect(heading).toContainText('123456ABC - Exposición climática');
});

test('the heading closes an open section again', async ({ page }) => {
  const heading = page
    .getByRole('region', { name: 'ID y tipo de análisis' })
    .getByRole('button', { name: /ID y tipo de análisis/ });

  await heading.click();
  await expect(heading).toHaveAttribute('aria-expanded', 'true');
  await heading.click();
  await expect(heading).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('navigation', { name: 'Tipo de análisis' })).toHaveCount(0);
});

test('Riesgo productivo asks for the login first, and signing in goes on to it', async ({
  page,
}) => {
  const section = page.getByRole('region', { name: 'ID y tipo de análisis' });
  const heading = section.getByRole('button', { name: /ID y tipo de análisis/ });
  const productivo = section.getByRole('link', { name: 'Riesgo productivo' });
  const login = page.getByRole('dialog', { name: 'Área privada' });

  // Signed out: the card opens the login modal and the page stays where it was.
  await heading.click();
  await productivo.click();
  await expect(login).toBeVisible();
  await expect(page).toHaveURL(/\/analisis\/exposicion-climatica$/);

  // Closing the modal forgets the way: the user button opens a plain login.
  await page.keyboard.press('Escape');
  await expect(login).toBeHidden();
  await productivo.click();
  await expect(login).toBeVisible();

  // Signing in goes on to productivo.
  await login.getByLabel('Email').fill('analista@example.com');
  await login.getByLabel('Contraseña').fill('cualquiera');
  await login.getByRole('button', { name: 'Acceder' }).click();
  await expect(login).toBeHidden();
  await expect(page).toHaveURL(/\/analisis\/productivo$/);
});
