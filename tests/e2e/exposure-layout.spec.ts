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
  await surface.click();
  await expect(surface).toHaveAttribute('aria-selected', 'true');

  // Nothing picked: the content column is the prompt.
  const main = page.getByRole('main');
  await expect(main.getByText('Seleccione un distrito en el mapa')).toBeVisible();
  await expect(main.locator('canvas')).toHaveCount(0);
});
