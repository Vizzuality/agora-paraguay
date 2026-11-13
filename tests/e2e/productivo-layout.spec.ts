import { expect, test } from '@playwright/test';

import { PARAGUAY_VIEW_STATE } from '../../src/lib/map/view-state';
import { stubAnalysisApi } from './fixtures/api';
import { stubAuth } from './fixtures/auth';
import { cameraUrl, drawPolygon, mapCanvas, stubBasemap } from './fixtures/map';

const POLYGON = [
  { x: 300, y: 250 },
  { x: 360, y: 250 },
  { x: 360, y: 350 },
];

test('Riesgo productivo gates its analysis, then shows the actions and widgets in the content column', async ({
  page,
}) => {
  await stubBasemap(page);
  await stubAnalysisApi(page);
  await stubAuth(page);
  await page.goto(cameraUrl({ ...PARAGUAY_VIEW_STATE, zoom: 12 }, '/v2/productivo'));

  const area = page.getByRole('region', { name: 'Área de interés' });
  await expect(area.getByRole('button', { name: 'Dibujar polígono' })).toBeEnabled();
  await expect(mapCanvas(page)).toBeVisible();
  await area.getByRole('button', { name: 'Dibujar polígono' }).click();
  await drawPolygon(page, POLYGON);
  await area.getByRole('button', { name: 'Analizar' }).click();

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

  // Productivo keeps the picker out of Cultivo y fechas.
  const filters = page.getByRole('region', { name: 'Cultivo y fechas' });
  await filters.getByRole('button', { name: /Cultivo y fechas/ }).click();
  await expect(filters.getByRole('combobox', { name: 'Tipo de cultivo' })).toBeVisible();
  await expect(filters.getByRole('button', { name: 'Personalizar indicadores' })).toHaveCount(0);
});
