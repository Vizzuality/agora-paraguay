import { expect, test } from '@playwright/test';

import { analyseOnRedesign } from './fixtures/redesign';

test('Riesgo productivo gates its analysis, then shows the actions and widgets in the content column', async ({
  page,
}) => {
  await analyseOnRedesign(page, '/v2/productivo');

  // Private: the login card stands in for the analysis.
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Exportar informe' })).toHaveCount(0);

  // Stubbed login (`stubAuth`): any credentials open the analysis in place.
  await main.getByLabel('Email').fill('analista@example.com');
  await main.getByLabel('Contraseña').fill('cualquiera');
  await main.getByRole('button', { name: 'Acceder' }).click();
  await expect(main.getByRole('heading', { name: 'Iniciar sesión' })).toBeHidden();

  // Personalizar indicadores beside Exportar informe, then the widgets.
  await expect(main.getByRole('button', { name: 'Personalizar indicadores' })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Exportar informe' })).toBeEnabled();
  await expect(
    main.getByRole('heading', { name: 'Producción base histórica de soja' }),
  ).toBeVisible();

  // The six projection indicators read as one chart, across the content column.
  const projection = main
    .getByRole('heading', {
      name: 'Producción proyectada a escenario pesimista, central y optimista',
    })
    .locator('..')
    .locator('..');
  await expect(projection.getByRole('listitem')).toHaveText([
    'Base histórica: central 3,68 t/ha, pesimista 3,58 t/ha, optimista 3,78 t/ha',
    'Horizonte 5 años: central 3,55 t/ha, pesimista 2,92 t/ha, optimista 4,17 t/ha',
    'Horizonte 10 años: central 3,35 t/ha, pesimista 2,52 t/ha, optimista 4,27 t/ha',
  ]);
  await expect(
    main.getByRole('heading', { name: /^Producción proyectada (LOW|MID|HIGH)/ }),
  ).toHaveCount(0);

  // Productivo keeps the picker out of Cultivo y fechas.
  const filters = page.getByRole('region', { name: 'Cultivo y fechas' });
  await filters.getByRole('button', { name: /Cultivo y fechas/ }).click();
  await expect(filters.getByRole('combobox', { name: 'Tipo de cultivo' })).toBeVisible();
  await expect(filters.getByRole('button', { name: 'Personalizar indicadores' })).toHaveCount(0);
});
