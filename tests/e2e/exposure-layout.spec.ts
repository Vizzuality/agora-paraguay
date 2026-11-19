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
  // Each class with its range, and the footnote on how the share is counted.
  await expect(legend.getByText('Baja (>0-10%)')).toBeVisible();
  await expect(map.getByText(/las áreas coincidentes se cuentan una sola vez/)).toBeVisible();
  await map.getByRole('button', { name: 'Ocultar leyenda' }).click();
  await expect(legend).toHaveCount(0);
  await map.getByRole('button', { name: 'Mostrar leyenda' }).click();
  await expect(legend).toBeVisible();

  // Nivel de exposición's legend is a key only: no eye, slider or handle on its rows.
  await expect(legend.getByRole('button')).toHaveCount(0);

  await surface.click();
  await expect(surface).toHaveAttribute('aria-selected', 'true');
  const layers = map.getByRole('list', { name: 'Leyenda de capas' });
  await expect(layers).toBeVisible();

  // Superficie expuesta's layers get every control: each row hides its layer and back,
  const rows = layers.getByRole('listitem');
  const first = (await rows.first().textContent())!;
  const hide = layers.getByRole('button', { name: `Ocultar ${first}` });
  await expect(hide).toHaveAttribute('aria-pressed', 'true');
  await hide.click();
  const show = layers.getByRole('button', { name: `Mostrar ${first}` });
  await expect(show).toHaveAttribute('aria-pressed', 'false');
  await show.click();

  // fades it from a slider, stepped by 5 % with the arrow keys,
  await layers.getByRole('button', { name: `Opacidad de ${first}: 100 %` }).click();
  await page.getByRole('slider', { name: `Opacidad de ${first}` }).press('ArrowLeft');
  await expect(layers.getByRole('button', { name: `Opacidad de ${first}: 95 %` })).toBeVisible();
  await page.keyboard.press('Escape');

  // and moves it with its handle's arrow keys.
  await layers.getByRole('button', { name: `Reordenar ${first}` }).press('ArrowDown');
  await expect(rows.nth(1)).toHaveText(first);
  await layers.getByRole('button', { name: `Reordenar ${first}` }).press('ArrowUp');
  await expect(rows.first()).toHaveText(first);
});
