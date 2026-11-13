import { expect, test } from '@playwright/test';

import { analyseOnRedesign } from './fixtures/redesign';

test('Riesgo sanitario shows its widgets in the content column once analysed', async ({ page }) => {
  await analyseOnRedesign(page, '/v2/sanitario');

  // The rust card, read on the ruler: the west parcel sits at the top of its range.
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { name: 'Phakopsora pachyrhizi' })).toBeVisible();

  // Personalizar indicadores closes the Cultivo y fechas section on sanitario.
  const filters = page.getByRole('region', { name: 'Cultivo y fechas' });
  await filters.getByRole('button', { name: /Cultivo y fechas/ }).click();
  await expect(filters.getByRole('button', { name: 'Personalizar indicadores' })).toBeVisible();
});
