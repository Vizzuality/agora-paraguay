import { expect, test } from '@playwright/test';

import { stubAnalysisApi } from './fixtures/api';
import { stubAuth } from './fixtures/auth';
import { stubBasemap } from './fixtures/map';

test('Exposición climática fills the content column with its map and prompts for a district in the settings', async ({
  page,
}) => {
  await stubBasemap(page);
  await stubAnalysisApi(page);
  await stubAuth(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/analisis/exposicion-climatica');

  // Nothing picked: the map is the content column, two views over it, no section to fold.
  const settings = page.getByRole('complementary', { name: 'Configuración' });
  const main = page.getByRole('main');
  const map = main.getByRole('region', { name: 'Área de interés' });
  await expect(map.locator('canvas.maplibregl-canvas')).toBeVisible();
  await expect(map.getByRole('button', { name: /^Área de interés/ })).toHaveCount(0);

  // The prompt holds the settings column under the analysis type, down to the map's bottom.
  const prompt = settings.getByText('Seleccione un distrito en el mapa');
  await expect(prompt).toBeVisible();
  await expect(settings.getByRole('region', { name: 'Área de interés' })).toHaveCount(0);
  await expect(settings.locator('canvas')).toHaveCount(0);
  // The prompt's paragraph sits straight in its card.
  const promptCard = prompt.locator('..');
  const promptBox = await promptCard.boundingBox();
  const mapBox = await map.boundingBox();
  expect(Math.abs(promptBox!.y + promptBox!.height - (mapBox!.y + mapBox!.height))).toBeLessThan(2);

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

  // The rows only hide: no opacity slider, no reordering.
  await expect(legend.getByRole('button', { name: /^Opacidad de/ })).toHaveCount(0);
  await expect(legend.getByRole('button', { name: /^Reordenar/ })).toHaveCount(0);

  await surface.click();
  await expect(surface).toHaveAttribute('aria-selected', 'true');
  await expect(map.getByRole('list', { name: 'Leyenda de capas' })).toBeVisible();
});
