import { expect, test } from '@playwright/test';

import { INITIAL_VIEW_STATE } from '../../src/lib/map/view-state';
import { mapCanvas, panMap, stubBasemap } from './fixtures/map';

// Temporary while the cadastre covers Alto Paraná only: the map opens there
// (`INITIAL_VIEW_STATE`), says so, and the first camera write lands on that view.
// Delete this test with `DevFocusBanner` when the view goes back to the whole country.
test('opens on Alto Paraná with the development banner', async ({ page }) => {
  await stubBasemap(page);
  await page.goto('/');
  await expect(mapCanvas(page)).toBeVisible();
  await expect(page.getByRole('note')).toHaveText(
    'En desarrollo: el mapa se centra en Alto Paraná, la zona con datos. Con el catastro completo, se centrará en todo Paraguay.',
  );

  // A vertical pan: the longitude and zoom stay the opening view's, only the latitude moves.
  await panMap(page, { dx: 0, dy: -40 });

  const params = new URL(page.url()).searchParams;

  expect(Number(params.get('lng'))).toBeCloseTo(INITIAL_VIEW_STATE.longitude, 2);
  expect(Number(params.get('zoom'))).toBe(INITIAL_VIEW_STATE.zoom);
});

/**
 * Regression: the nuqs TanStack Router adapter passes the camera's query string inside
 * `navigate({ to })`, and any router search middleware that retains params re-appends
 * the previous search after it — every camera move then doubled the query string
 * (`/?lat=X?lat=Y?lat=Z…`) and the URL grew without bound. Fixed by dropping
 * `retainSearchParams(true)` from the root route.
 */
test('panning twice keeps the camera URL well-formed', async ({ page }) => {
  await stubBasemap(page);
  await page.goto('/');
  await expect(mapCanvas(page)).toBeVisible();

  // Two moves, because the doubling only shows up once the URL already has params.
  await panMap(page, { dx: 0, dy: -80 });
  await panMap(page, { dx: 50, dy: 30 });

  const url = page.url();

  // The doubling bug nested query strings, so a single "?" is the check that fails
  // on the old behaviour.
  expect(url.match(/\?/g)).toHaveLength(1);

  // Every camera write carries the three numbers, each exactly once.
  const params = new URL(url).searchParams;

  for (const key of ['lng', 'lat', 'zoom']) {
    const values = params.getAll(key);

    expect(values).toHaveLength(1);
    expect(Number.isFinite(Number.parseFloat(values[0]))).toBe(true);
  }
});
