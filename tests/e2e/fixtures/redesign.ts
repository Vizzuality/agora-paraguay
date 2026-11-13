import { expect, type Page } from '@playwright/test';

import { PARAGUAY_VIEW_STATE } from '../../../src/lib/map/view-state';
import { stubAnalysisApi } from './api';
import { stubAuth } from './auth';
import { cameraUrl, drawPolygon, mapCanvas, stubBasemap } from './map';

// Canvas-relative, inside the content column's map; a few farms at farm scale.
const POLYGON = [
  { x: 300, y: 250 },
  { x: 360, y: 250 },
  { x: 360, y: 350 },
];

/** Opens a redesign riesgo page at farm scale, draws an área de interés and runs Analizar. */
export async function analyseOnRedesign(page: Page, path: '/v2/sanitario' | '/v2/productivo') {
  await stubBasemap(page);
  await stubAnalysisApi(page);
  await stubAuth(page);
  await page.goto(cameraUrl({ ...PARAGUAY_VIEW_STATE, zoom: 12 }, path));

  const area = page.getByRole('region', { name: 'Área de interés' });
  const draw = area.getByRole('button', { name: 'Dibujar polígono' });
  await expect(draw).toBeEnabled();
  await expect(mapCanvas(page)).toBeVisible();
  await draw.click();
  await drawPolygon(page, POLYGON);
  await area.getByRole('button', { name: 'Analizar' }).click();
}
