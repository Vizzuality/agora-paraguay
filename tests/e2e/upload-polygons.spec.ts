import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test, type Page } from "@playwright/test";

import { drawPolygon, mapCanvas, stubBasemap } from "./fixtures/map";

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "uploads");

/**
 * Screen position inside the first part of the uploaded "Estancia Norte" MultiPolygon:
 * the part spans 59.4°W–57.4°W / 24.4°S–22.4°S, which contains the initial camera
 * centre (58.44°W, 23.44°S) — the middle of the default 1280×720 viewport.
 */
const INSIDE_UPLOADED_POLYGON = { x: 640, y: 360 };

/** Clear of every overlay and of the uploaded polygons; from `draw-controls.spec.ts`. */
const DRAWN_POLYGON = [
  { x: 880, y: 450 },
  { x: 1000, y: 450 },
  { x: 1000, y: 550 },
];

function controls(page: Page) {
  return {
    upload: page.getByRole("button", { name: "Upload areas" }),
    input: page.locator('input[type="file"]'),
    edit: page.getByRole("button", { name: "Select and edit areas" }),
    remove: page.getByRole("button", { name: "Delete the selected area" }),
    status: page.getByRole("group", { name: "Drawing tools" }).locator("p"),
    notices: page.getByRole("region", { name: "Upload notices" }),
  };
}

function areaButton(page: Page, name: string) {
  return page.getByRole("button", { name, exact: true });
}

async function upload(page: Page, fixture: string) {
  await controls(page).input.setInputFiles(join(FIXTURES, fixture));
}

test.beforeEach(async ({ page }) => {
  await stubBasemap(page);
  await page.goto("/");

  // Terra Draw starts on the style's `load` event; the Upload button is disabled until
  // it has, and waiting on that is what makes the rest of the spec deterministic.
  await expect(controls(page).upload).toBeEnabled();
  await expect(mapCanvas(page)).toBeVisible();
});

test("imports a GeoJSON upload, exploding its MultiPolygon", async ({ page }) => {
  const { status, notices } = controls(page);

  await upload(page, "farms.geojson");

  await expect(status).toHaveText("3 areas drawn. Imported 3 areas from farms.geojson.");

  // The MultiPolygon became two named parts; the lone point became a warning.
  await expect(areaButton(page, "Estancia Norte (1/2)")).toBeVisible();
  await expect(areaButton(page, "Estancia Norte (2/2)")).toBeVisible();
  await expect(areaButton(page, "Campo Sur")).toBeVisible();
  await expect(notices).toContainText("Skipped 1 non-polygon feature.");

  // The first polygon is auto-selected for analysis.
  await expect(areaButton(page, "Estancia Norte (1/2)")).toHaveAttribute("aria-pressed", "true");
});

test("switches the analysis selection from the list", async ({ page }) => {
  await upload(page, "farms.geojson");

  await areaButton(page, "Campo Sur").click();

  await expect(areaButton(page, "Campo Sur")).toHaveAttribute("aria-pressed", "true");
  await expect(areaButton(page, "Estancia Norte (1/2)")).toHaveAttribute("aria-pressed", "false");
});

test("a new upload replaces the uploaded polygons and keeps the drawn ones", async ({ page }) => {
  const { status } = controls(page);

  await upload(page, "farms.geojson");
  await expect(status).toContainText("3 areas drawn.");

  await page.getByRole("button", { name: "Draw an area" }).click();
  await drawPolygon(page, DRAWN_POLYGON);
  await expect(status).toContainText("4 areas drawn.");

  await upload(page, "farms.kml");

  await expect(status).toHaveText("3 areas drawn. Imported 2 areas from farms.kml.");
  await expect(areaButton(page, "Drawn area 1")).toBeVisible();
  await expect(areaButton(page, "Estancia KML")).toBeVisible();
  await expect(areaButton(page, "Campo KML")).toBeVisible();
  await expect(areaButton(page, "Campo Sur")).toBeHidden();
});

test("uploaded polygons are editable: select and delete one", async ({ page }) => {
  const { edit, remove, status } = controls(page);

  await upload(page, "farms.geojson");

  await edit.click();
  await mapCanvas(page).click({ position: INSIDE_UPLOADED_POLYGON });
  await expect(remove).toBeEnabled();

  await remove.click();

  await expect(status).toContainText("2 areas drawn.");
  await expect(areaButton(page, "Estancia Norte (1/2)")).toBeHidden();
});

test("imports a KMZ with names from the KML inside", async ({ page }) => {
  const { status } = controls(page);

  await upload(page, "farms.kmz");

  await expect(status).toHaveText("2 areas drawn. Imported 2 areas from farms.kmz.");
  await expect(areaButton(page, "Estancia KML")).toBeVisible();
  await expect(areaButton(page, "Campo KML")).toBeVisible();
});

test("imports a UTM 21S shapefile, reprojected via its .prj", async ({ page }) => {
  const { status } = controls(page);

  await upload(page, "farms-utm21s.zip");

  await expect(status).toHaveText("2 areas drawn. Imported 2 areas from farms-utm21s.zip.");
  await expect(areaButton(page, "Estancia San Pedro")).toBeVisible();
  await expect(areaButton(page, "Campo Verde")).toBeVisible();
});

test("skips holed polygons with a warning naming them", async ({ page }) => {
  const { status, notices } = controls(page);

  await upload(page, "farms-holes.geojson");

  await expect(status).toHaveText("1 area drawn. Imported 1 area from farms-holes.geojson.");
  await expect(notices).toContainText('"Laguna Grande" has interior rings (holes)');
  await expect(areaButton(page, "Potrero")).toBeVisible();

  await notices.getByRole("button", { name: "Dismiss upload notices" }).click();
  await expect(notices).toBeHidden();
});

test("a failed upload keeps the polygons already on the map", async ({ page }) => {
  const { status, notices } = controls(page);

  await upload(page, "farms.geojson");
  await expect(status).toContainText("3 areas drawn.");

  await upload(page, "points.geojson");

  await expect(notices).toContainText("The file contains no importable polygons — found 2 points.");
  await expect(status).toContainText("3 areas drawn.");
  await expect(areaButton(page, "Campo Sur")).toBeVisible();
});

test("rejects a corrupt zip with a readable error", async ({ page }) => {
  const { notices } = controls(page);

  await upload(page, "corrupt.zip");

  await expect(notices).toContainText("The file could not be read as a zip archive.");
});

// Uploads live in the same in-memory store as drawn polygons, and only the camera is
// persisted — so a reload clears them, consistently with `draw-controls.spec.ts`.
test("loses the upload on reload", async ({ page }) => {
  const { status } = controls(page);

  await upload(page, "farms.geojson");
  await expect(status).toContainText("3 areas drawn.");

  await page.reload();

  await expect(controls(page).upload).toBeEnabled();
  await expect(controls(page).status).toHaveText("No areas drawn.");
  await expect(areaButton(page, "Campo Sur")).toBeHidden();
});
