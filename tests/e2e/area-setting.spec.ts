import { expect, test, type Page } from '@playwright/test';

import { PARAGUAY_VIEW_STATE } from '../../src/lib/map/view-state';
import { stubAnalysisApi } from './fixtures/api';
import { stubAuth } from './fixtures/auth';
import { cameraUrl, drawPolygon, mapCanvas, stubBasemap } from './fixtures/map';
import { savedAnalysedParcelCount } from './fixtures/saved-selection';

// Farm scale, where the test triangle is a few farms rather than a department.
const FARM_SCALE_URL_SANITARIO = cameraUrl(
  { ...PARAGUAY_VIEW_STATE, zoom: 12 },
  '/analisis/sanitario',
);

// Canvas-relative, inside the content column's map.
const POLYGON = [
  { x: 300, y: 250 },
  { x: 360, y: 250 },
  { x: 360, y: 350 },
];

function area(page: Page) {
  return page.getByRole('region', { name: 'Área de interés' });
}

test.beforeEach(async ({ page }) => {
  await stubBasemap(page);
  await stubAnalysisApi(page);
  await stubAuth(page);
  await page.goto(FARM_SCALE_URL_SANITARIO);

  // Terra Draw is bound once the draw card is enabled.
  await expect(area(page).getByRole('button', { name: 'Dibujar polígono' })).toBeEnabled();
  await expect(mapCanvas(page)).toBeVisible();
});

test('draws an area, analyses it, and edits the parcels back', async ({ page }) => {
  const section = area(page);

  // Open from the start on a riesgo; drawing turns the card into Borrar mapa with the how-to.
  await section.getByRole('button', { name: 'Dibujar polígono' }).click();
  await expect(section.getByRole('button', { name: 'Borrar mapa' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(section).toContainText('Haga clic para comenzar el polígono');

  await drawPolygon(page, POLYGON);
  const analyze = section.getByRole('button', { name: 'Analizar' });
  await expect(analyze).toBeEnabled();
  await expect(section).toContainText('Verifique que estas son las parcelas');

  // Analizar stays on the page: the map gives way, the section shows the parcels.
  await analyze.click();
  await expect(page.getByRole('main').locator('canvas')).toHaveCount(0);
  await expect(section.locator('canvas.maplibregl-canvas')).toBeVisible();
  await expect(section.getByRole('combobox', { name: 'Parcela' })).toHaveText('Todas');
  await expect(page).toHaveURL(/\/analisis\/sanitario/);

  // Editar parcelas goes back to the selection with the parcels kept.
  await section.getByRole('button', { name: 'Editar parcelas' }).click();
  await expect(section.getByRole('button', { name: 'Analizar' })).toBeEnabled();
});

test('a reload keeps the analysis', async ({ page }) => {
  const section = area(page);

  await section.getByRole('button', { name: 'Dibujar polígono' }).click();
  await drawPolygon(page, POLYGON);
  await section.getByRole('button', { name: 'Analizar' }).click();
  await expect(section.getByRole('combobox', { name: 'Parcela' })).toBeVisible();
  // The save is debounced: reload only once the analysed parcels are on disk.
  await expect.poll(() => savedAnalysedParcelCount(page)).toBeGreaterThan(0);

  await page.reload();
  await expect(area(page).getByRole('combobox', { name: 'Parcela' })).toHaveText('Todas');
});

test('Borrar mapa clears the drawing and disarms the tool', async ({ page }) => {
  const section = area(page);

  await section.getByRole('button', { name: 'Dibujar polígono' }).click();
  await section.getByRole('button', { name: 'Borrar mapa' }).click();

  await expect(section.getByRole('button', { name: 'Dibujar polígono' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await expect(section).not.toContainText('Haga clic para comenzar el polígono');
});

test('once analysed, Cultivo y fechas holds the filters and names them closed', async ({
  page,
}) => {
  const section = area(page);
  const filters = page.getByRole('region', { name: 'Cultivo y fechas' });

  // Nothing to filter before Analizar.
  await expect(filters).toHaveCount(0);

  await section.getByRole('button', { name: 'Dibujar polígono' }).click();
  await drawPolygon(page, POLYGON);
  await section.getByRole('button', { name: 'Analizar' }).click();

  const heading = filters.getByRole('button', { name: /Cultivo y fechas/ });
  await expect(heading).toContainText('Soja');

  await heading.click();
  await expect(filters.getByRole('combobox', { name: 'Tipo de cultivo' })).toHaveText('Soja');
  // One section open at a time: the área closes.
  await expect(section.getByRole('combobox', { name: 'Parcela' })).toHaveCount(0);
});
