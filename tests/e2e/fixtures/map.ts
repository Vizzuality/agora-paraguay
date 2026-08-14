import type { Page } from "@playwright/test";

/**
 * A valid MapLibre style with nothing in it.
 *
 * The app's default basemap is CARTO Positron, fetched from a CDN. Letting the specs hit
 * it would make them slow and dependent on someone else's uptime, and none of what they
 * assert is about tiles — so the style request is stubbed with an empty one. MapLibre
 * still fires `load`, which is what starts Terra Draw.
 */
const EMPTY_STYLE = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#f5f5f5" },
    },
  ],
};

/** Stubs the basemap so the map loads without network access. */
export async function stubBasemap(page: Page) {
  await page.route("https://basemaps.cartocdn.com/**", (route) =>
    route.fulfill({ json: EMPTY_STYLE }),
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
