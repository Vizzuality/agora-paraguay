import { expect, test } from '@playwright/test';

import { stubAnalysisApi } from './fixtures/api';
import { stubAuth } from './fixtures/auth';
import { stubBasemap } from './fixtures/map';

test('a closed info card comes back when the analysis type changes or the page is entered again', async ({
  page,
}) => {
  await stubBasemap(page);
  await stubAnalysisApi(page);
  await stubAuth(page);
  await page.goto('/analisis/exposicion-climatica');

  const settings = page.getByRole('complementary', { name: 'Configuración' });
  const exposure = settings.getByRole('region', { name: 'Acerca de Exposición climática' });
  const sanitario = settings.getByRole('region', { name: 'Acerca de Riesgo sanitario' });
  const section = settings.getByRole('region', { name: 'ID y tipo de análisis' });
  const chooseType = async (name: string) => {
    await section.getByRole('button', { name: /ID y tipo de análisis/ }).click();
    await section
      .getByRole('navigation', { name: 'Tipo de análisis' })
      .getByRole('link', { name })
      .click();
  };

  await expect(exposure).toBeVisible();
  await exposure.getByRole('button', { name: 'Cerrar' }).click();
  await expect(exposure).toHaveCount(0);

  await chooseType('Riesgo sanitario');
  await expect(sanitario.getByText(/Consulte condiciones meteorológicas/)).toBeVisible();
  await sanitario.getByRole('button', { name: 'Cerrar' }).click();
  await expect(sanitario).toHaveCount(0);

  await chooseType('Exposición climática');
  await expect(exposure).toBeVisible();

  await exposure.getByRole('button', { name: 'Cerrar' }).click();
  await page.reload();
  await expect(exposure).toBeVisible();
});
