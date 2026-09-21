import type { Page } from '@playwright/test';

/** A 1×1 transparent PNG, so stubbed raster tiles decode cleanly. */
const BLANK_TILE = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
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
  await page.route('https://server.arcgisonline.com/**', (route) =>
    route.fulfill({ contentType: 'image/png', body: BLANK_TILE }),
  );
}

/** The MapLibre canvas, which is what draw interactions click on. */
export function mapCanvas(page: Page) {
  return page.locator('canvas.maplibregl-canvas');
}

/** Pans the camera by dragging from the canvas centre, then waits for the URL to update. */
export async function panMap(page: Page, delta: { dx: number; dy: number }) {
  const urlBefore = page.url();
  const box = await mapCanvas(page).boundingBox();
  if (!box) throw new Error('Map canvas has no bounding box');

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + delta.dx, centerY + delta.dy, { steps: 10 });
  await page.mouse.up();

  // The camera is written to the URL throttled (200ms) after moveend.
  await page.waitForFunction((previous) => window.location.href !== previous, urlBefore, {
    timeout: 5_000,
  });
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

  await page.keyboard.press('Enter');
}

/**
 * How many canvas pixels read as the selected-parcel yellow (`#F1FF28` at 0.35 over the
 * blank basemap). The layers live on a WebGL canvas, nothing in the DOM: a screenshot,
 * decoded in the page on a 2D canvas, is the only way to assert what is painted.
 */
export async function yellowPixelCount(page: Page): Promise<number> {
  const png = await mapCanvas(page).screenshot();

  return page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();

    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    if (!context) return 0;
    context.drawImage(image, 0, 0);

    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let count = 0;

    for (let index = 0; index < data.length; index += 4) {
      const [r, g, b] = [data[index], data[index + 1], data[index + 2]];
      // Yellow: red and green high and close, blue well below both.
      if (r > 150 && g > 150 && Math.abs(r - g) < 40 && g - b > 60) count += 1;
    }

    return count;
  }, png.toString('base64'));
}
