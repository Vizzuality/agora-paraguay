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

test('Riesgo sanitario shows its widgets in the content column once analysed', async ({ page }) => {
  await stubBasemap(page);
  await stubAnalysisApi(page);
  await stubAuth(page);
  await page.goto(cameraUrl({ ...PARAGUAY_VIEW_STATE, zoom: 12 }, '/v2/sanitario'));

  const area = page.getByRole('region', { name: 'Área de interés' });
  await expect(area.getByRole('button', { name: 'Dibujar polígono' })).toBeEnabled();
  await expect(mapCanvas(page)).toBeVisible();
  await area.getByRole('button', { name: 'Dibujar polígono' }).click();
  await drawPolygon(page, POLYGON);
  await area.getByRole('button', { name: 'Analizar' }).click();

  // The rust card, read on the ruler: the west parcel sits at the top of its range.
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { name: 'Phakopsora pachyrhizi' })).toBeVisible();

  // Personalizar indicadores closes the Cultivo y fechas section on sanitario.
  const filters = page.getByRole('region', { name: 'Cultivo y fechas' });
  await filters.getByRole('button', { name: /Cultivo y fechas/ }).click();
  await expect(filters.getByRole('button', { name: 'Personalizar indicadores' })).toBeVisible();
});
