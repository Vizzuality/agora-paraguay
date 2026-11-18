import { expect, test, type Locator, type Page } from '@playwright/test';

import { stubAnalysisApi } from './fixtures/api';
import { stubAuth } from './fixtures/auth';
import { stubBasemap } from './fixtures/map';

/** Every map: credits ⓘ then the scale beside it top left, zoom in the bottom-right quarter. */
async function expectCorners(page: Page, map: Locator) {
  const topLeft = map.locator('.maplibregl-ctrl-top-left > .maplibregl-ctrl');

  await expect(topLeft).toHaveCount(2);
  await expect(topLeft.nth(0)).toHaveClass(/maplibregl-ctrl-attrib/);
  await expect(topLeft.nth(1)).toHaveClass(/maplibregl-ctrl-scale/);

  // The ⓘ is a 32px disc; the scale sits on its right, centred on the same row.
  const info = (await topLeft.nth(0).boundingBox())!;
  const scale = (await topLeft.nth(1).boundingBox())!;
  expect(info.width).toBe(32);
  expect(info.height).toBe(32);
  expect(scale.x).toBeGreaterThan(info.x + info.width);
  expect(Math.abs(scale.y + scale.height / 2 - (info.y + info.height / 2))).toBeLessThan(1);
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

test('opening the credits covers the scale without moving it', async ({ page }) => {
  await page.goto('/analisis/sanitario');
  const map = page.locator('.maplibregl-map').first();
  const scale = map.locator('.maplibregl-ctrl-scale');
  const before = (await scale.boundingBox())!;

  await map.getByRole('button', { name: /attribution/i }).click();
  await expect(map.locator('.maplibregl-compact-show')).toBeVisible();

  expect(await scale.boundingBox()).toEqual(before);

  // Same 8px inset at both ends as the closed disc: 8 + 16px icon + 8 before the text.
  const credits = (await map.locator('.maplibregl-compact-show').boundingBox())!;
  const text = (await map.locator('.maplibregl-ctrl-attrib-inner').boundingBox())!;
  expect(text.x - credits.x).toBe(32);
  expect(credits.x + credits.width - (text.x + text.width)).toBeCloseTo(8, 0);
  const topmost = await page.evaluate(
    ([x, y]) => !!document.elementFromPoint(x, y)?.closest('.maplibregl-ctrl-attrib'),
    [before.x + before.width / 2, before.y + before.height / 2],
  );
  expect(topmost).toBe(true);
});
