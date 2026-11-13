import { expect, test, type Locator, type Page } from '@playwright/test';

import { stubAnalysisApi } from './fixtures/api';
import { stubAuth } from './fixtures/auth';
import { stubBasemap } from './fixtures/map';

/** Every map: credits ⓘ then the scale top left, zoom in the bottom-right quarter. */
async function expectCorners(page: Page, map: Locator) {
  const topLeft = map.locator('.maplibregl-ctrl-top-left > .maplibregl-ctrl');

  await expect(topLeft).toHaveCount(2);
  await expect(topLeft.nth(0)).toHaveClass(/maplibregl-ctrl-attrib/);
  await expect(topLeft.nth(1)).toHaveClass(/maplibregl-ctrl-scale/);
  await expect(map.locator('.maplibregl-ctrl-bottom-left > .maplibregl-ctrl')).toHaveCount(0);

  const mapBox = (await map.boundingBox())!;
  const zoomBox = (await map.getByRole('button', { name: 'Acercar' }).boundingBox())!;

  expect(zoomBox.x).toBeGreaterThan(mapBox.x + mapBox.width / 2);
  expect(zoomBox.y).toBeGreaterThan(mapBox.y + mapBox.height / 2);
}

test.beforeEach(async ({ page }) => {
  await stubBasemap(page);
  await stubAnalysisApi(page);
  await stubAuth(page);
});

test('the selection map keeps credits and scale top left, zoom bottom right', async ({ page }) => {
  await page.goto('/analisis/sanitario');

  await expectCorners(page, page.locator('.maplibregl-map').first());
});

test('the panel map keeps credits and scale top left, zoom bottom right', async ({ page }) => {
  await page.goto('/analisis/exposicion-climatica');

  await expectCorners(page, page.locator('.maplibregl-map').first());
});
