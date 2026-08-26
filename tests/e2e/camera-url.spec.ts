import { expect, test } from "@playwright/test";

import { mapCanvas, panMap, stubBasemap } from "./fixtures/map";

/**
 * Regression: the nuqs TanStack Router adapter passes the camera's query string inside
 * `navigate({ to })`, and any router search middleware that retains params re-appends
 * the previous search after it — every camera move then doubled the query string
 * (`/?lat=X?lat=Y?lat=Z…`) and the URL grew without bound. Fixed by dropping
 * `retainSearchParams(true)` from the root route.
 */
test("panning twice keeps the camera URL well-formed", async ({ page }) => {
  await stubBasemap(page);
  await page.goto("/");
  await expect(mapCanvas(page)).toBeVisible();

  // Two moves, because the doubling only shows up once the URL already has params.
  await panMap(page, { dx: 0, dy: -80 });
  await panMap(page, { dx: 50, dy: 30 });

  const url = page.url();

  // The doubling bug nested query strings, so a single "?" is the check that fails
  // on the old behaviour.
  expect(url.match(/\?/g)).toHaveLength(1);

  // Panning changes lng/lat only — zoom stays at its default and nuqs omits it.
  const params = new URL(url).searchParams;

  for (const key of ["lng", "lat"]) {
    const values = params.getAll(key);

    expect(values).toHaveLength(1);
    expect(Number.isFinite(Number.parseFloat(values[0]))).toBe(true);
  }
});
