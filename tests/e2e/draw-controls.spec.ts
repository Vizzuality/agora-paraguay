import { expect, test, type Page } from "@playwright/test";

import { drawPolygon, mapCanvas, stubBasemap } from "./fixtures/map";

// Well clear of the two overlays: the panel occupies the left ~400px, the toolbar the
// top-right corner. Clicks landing on either would never reach the map canvas.
const FIRST_POLYGON = [
  { x: 600, y: 250 },
  { x: 720, y: 250 },
  { x: 720, y: 350 },
];

/** Inside the triangle above — what selecting the first polygon clicks on. */
const INSIDE_FIRST_POLYGON = { x: 700, y: 300 };

const SECOND_POLYGON = [
  { x: 880, y: 450 },
  { x: 1000, y: 450 },
  { x: 1000, y: 550 },
];

function controls(page: Page) {
  return {
    draw: page.getByRole("button", { name: "Draw an area" }),
    edit: page.getByRole("button", { name: "Select and edit areas" }),
    remove: page.getByRole("button", { name: "Delete the selected area" }),
    clear: page.getByRole("button", { name: "Delete all areas" }),
    status: page.getByRole("group", { name: "Drawing tools" }).locator("p"),
  };
}

test.beforeEach(async ({ page }) => {
  await stubBasemap(page);
  await page.goto("/");

  // Terra Draw starts on the style's `load` event, and the Draw button is disabled until
  // it has: waiting on that is what makes the rest of the spec deterministic.
  await expect(controls(page).draw).toBeEnabled();
  await expect(mapCanvas(page)).toBeVisible();
});

test("starts with nothing drawn and only drawing available", async ({ page }) => {
  const { edit, remove, clear, status } = controls(page);

  await expect(status).toHaveText("No areas drawn.");
  await expect(edit).toBeDisabled();
  await expect(remove).toBeDisabled();
  await expect(clear).toBeDisabled();
});

test("draws several polygons without leaving draw mode", async ({ page }) => {
  const { draw, edit, clear, status } = controls(page);

  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await expect(status).toHaveText("1 area drawn.");

  // Still armed: the second polygon needs no trip back to the toolbar.
  await expect(draw).toHaveAttribute("aria-pressed", "true");
  await drawPolygon(page, SECOND_POLYGON);
  await expect(status).toHaveText("2 areas drawn.");

  await expect(edit).toBeEnabled();
  await expect(clear).toBeEnabled();
});

test("deletes one selected polygon and keeps the rest", async ({ page }) => {
  const { draw, edit, remove, status } = controls(page);

  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await drawPolygon(page, SECOND_POLYGON);
  await expect(status).toHaveText("2 areas drawn.");

  await edit.click();
  await expect(remove).toBeDisabled();

  // Selecting is what enables deleting: click inside the first polygon.
  await mapCanvas(page).click({ position: INSIDE_FIRST_POLYGON });
  await expect(remove).toBeEnabled();

  await remove.click();
  await expect(status).toHaveText("1 area drawn.");
  await expect(remove).toBeDisabled();
});

test("clears every polygon at once", async ({ page }) => {
  const { draw, clear, edit, status } = controls(page);

  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await drawPolygon(page, SECOND_POLYGON);
  await expect(status).toHaveText("2 areas drawn.");

  await clear.click();
  await expect(status).toHaveText("No areas drawn.");
  await expect(clear).toBeDisabled();
  await expect(edit).toBeDisabled();
});

// The geometry is in-memory global state by design: only the camera is persisted, and it
// lives in the URL.
test("loses the drawing on reload", async ({ page }) => {
  const { draw, status } = controls(page);

  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await expect(status).toHaveText("1 area drawn.");

  await page.reload();

  await expect(controls(page).draw).toBeEnabled();
  await expect(controls(page).status).toHaveText("No areas drawn.");
});
