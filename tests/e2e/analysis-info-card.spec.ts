import { expect, test } from '@playwright/test';

import { stubAnalysisApi } from './fixtures/api';
import { stubAuth } from './fixtures/auth';
import { stubBasemap } from './fixtures/map';

test('a closed info card stays closed across reloads, the other types keeping theirs', async ({
  page,
}) => {
  await stubBasemap(page);
  await stubAnalysisApi(page);
  await stubAuth(page);
  await page.goto('/analisis/exposicion-climatica');

  const settings = page.getByRole('complementary', { name: 'Configuración' });
  const exposure = settings.getByRole('region', { name: 'Acerca de Exposición climática' });
  await expect(exposure).toBeVisible();
  await exposure.getByRole('button', { name: 'Cerrar' }).click();
  await expect(exposure).toHaveCount(0);

  await page.reload();
  await expect(settings.getByRole('heading', { name: 'Seleccione un distrito' })).toBeVisible();
  await expect(exposure).toHaveCount(0);

  await page.goto('/analisis/sanitario');
  await expect(
    settings
      .getByRole('region', { name: 'Acerca de Riesgo sanitario' })
      .getByText(/Consulte condiciones meteorológicas/),
  ).toBeVisible();
});
