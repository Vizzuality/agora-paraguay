import { expect, test } from '@playwright/test';

import { stubAuth } from './fixtures/auth';

test.beforeEach(async ({ page }) => {
  await stubAuth(page);
  await page.goto('/v2');
  // Hydrated once the theme switch's disabled placeholder has been replaced.
  await expect(page.getByRole('button', { name: 'Cambiar tema' })).toBeEnabled();
});

test('Tipo de análisis names the open type and switches between them', async ({ page }) => {
  // Bare /v2 lands on the public type.
  await expect(page).toHaveURL(/\/v2\/sanitario$/);

  const section = page.getByRole('region', { name: 'Tipo de análisis' });
  const heading = section.getByRole('button', { name: /Tipo de análisis/ });

  // Closed, the heading carries the current choice.
  await expect(heading).toHaveAttribute('aria-expanded', 'false');
  await expect(heading).toContainText('Riesgo sanitario');

  await heading.click();
  const types = section.getByRole('navigation', { name: 'Tipo de análisis' }).getByRole('link');
  await expect(types).toHaveText(['Exposición climática', 'Riesgo sanitario', 'Riesgo productivo']);
  await expect(types.filter({ hasText: 'Riesgo sanitario' })).toHaveAttribute(
    'aria-current',
    'page',
  );

  // Choosing navigates, closes the section, and the heading follows.
  await types.filter({ hasText: 'Exposición climática' }).click();
  await expect(page).toHaveURL(/\/v2\/exposicion-climatica$/);
  await expect(heading).toHaveAttribute('aria-expanded', 'false');
  await expect(heading).toContainText('Exposición climática');
});

test('the heading closes an open section again', async ({ page }) => {
  const heading = page
    .getByRole('region', { name: 'Tipo de análisis' })
    .getByRole('button', { name: /Tipo de análisis/ });

  await heading.click();
  await expect(heading).toHaveAttribute('aria-expanded', 'true');
  await heading.click();
  await expect(heading).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('navigation', { name: 'Tipo de análisis' })).toHaveCount(0);
});
