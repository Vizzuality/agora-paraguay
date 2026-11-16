import { expect, test } from '@playwright/test';

import { stubAnalysisApi } from './fixtures/api';
import { stubAuth } from './fixtures/auth';
import { stubBasemap } from './fixtures/map';

test('Exposición climática keeps its map in the settings column and prompts for a district', async ({
  page,
}) => {
  await stubBasemap(page);
  await stubAnalysisApi(page);
  await stubAuth(page);
  await page.goto('/analisis/exposicion-climatica');

  // The map card, with its two views, sits in the settings column; no área de interés.
  const settings = page.getByRole('complementary', { name: 'Configuración' });
  const map = settings.getByRole('region', { name: 'Mapa' });
  await expect(map.locator('canvas.maplibregl-canvas')).toBeVisible();
  await expect(settings.getByRole('region', { name: 'Área de interés' })).toHaveCount(0);

  const exposure = map.getByRole('tab', { name: 'Nivel de exposición' });
  const surface = map.getByRole('tab', { name: 'Superficie expuesta' });
  await expect(exposure).toHaveAttribute('aria-selected', 'true');

  // The legend folds like every map's: open to start, Ocultar leyenda folds it away.
  const legend = map.getByRole('list', { name: 'Leyenda de exposición' });
  await expect(legend.getByRole('listitem').first()).toBeVisible();
  await map.getByRole('button', { name: 'Ocultar leyenda' }).click();
  await expect(legend).toHaveCount(0);
  await map.getByRole('button', { name: 'Mostrar leyenda' }).click();
  await expect(legend).toBeVisible();

  // Each row hides its class from the map and back.
  const rows = legend.getByRole('listitem');
  const first = (await rows.first().textContent())!;
  const hide = legend.getByRole('button', { name: `Ocultar ${first}` });
  await expect(hide).toHaveAttribute('aria-pressed', 'true');
  await hide.click();
  const show = legend.getByRole('button', { name: `Mostrar ${first}` });
  await expect(show).toHaveAttribute('aria-pressed', 'false');
  await show.click();

  // Each row's opacity opens a slider; the arrow keys step it by 5 %.
  await legend.getByRole('button', { name: `Opacidad de ${first}: 100 %` }).click();
  await page.getByRole('slider', { name: `Opacidad de ${first}` }).press('ArrowLeft');
  await expect(legend.getByRole('button', { name: `Opacidad de ${first}: 95 %` })).toBeVisible();
  await page.keyboard.press('Escape');

  // A row's handle moves it with the arrow keys.
  await legend.getByRole('button', { name: `Reordenar ${first}` }).press('ArrowDown');
  await expect(rows.nth(1)).toHaveText(first);
  await legend.getByRole('button', { name: `Reordenar ${first}` }).press('ArrowUp');
  await expect(rows.first()).toHaveText(first);

  await surface.click();
  await expect(surface).toHaveAttribute('aria-selected', 'true');
  await expect(map.getByRole('list', { name: 'Leyenda de capas' })).toBeVisible();

  // Nothing picked: the content column is the prompt.
  const main = page.getByRole('main');
  await expect(main.getByText('Seleccione un distrito en el mapa')).toBeVisible();
  await expect(main.locator('canvas')).toHaveCount(0);
});
