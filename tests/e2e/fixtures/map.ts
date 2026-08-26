import type { Page } from "@playwright/test";

/** A 1×1 transparent PNG, so stubbed raster tiles decode cleanly. */
const BLANK_TILE = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

/**
 * Stubs the basemap so the map loads without network access.
 *
 * The app's built-in basemap is an inline satellite style (see
 * `src/lib/map/basemap.ts`), so there is no style.json request to stub — only its
 * raster tile requests to Esri. Letting the specs hit them would make them slow and
 * dependent on someone else's uptime, and none of what they assert is about tiles.
 * The inline style loads regardless, and `load` is what starts Terra Draw.
 */
export async function stubBasemap(page: Page) {
  await page.route("https://server.arcgisonline.com/**", (route) =>
    route.fulfill({ contentType: "image/png", body: BLANK_TILE }),
  );
}

/** The MapLibre canvas, which is what draw interactions click on. */
export function mapCanvas(page: Page) {
  return page.locator("canvas.maplibregl-canvas");
}

/**
 * Draws a polygon through the canvas: a click per vertex, then Enter, which is Terra
 * Draw's own finish shortcut in polygon mode.
 */
export async function drawPolygon(page: Page, vertices: { x: number; y: number }[]) {
  const canvas = mapCanvas(page);

  for (const position of vertices) {
    await canvas.click({ position });
  }

  await page.keyboard.press("Enter");
}
