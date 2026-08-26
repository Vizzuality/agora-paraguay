import { expect, test, type Page } from "@playwright/test";

import { drawPolygon, mapCanvas, stubBasemap } from "./fixtures/map";

// Positions are relative to the canvas, which is the right half of the 1280×720
// viewport (~640px wide) — the sidebar has the left half. Clear of the toolbar in the
// map's top-right corner.
const FIRST_POLYGON = [
  { x: 300, y: 250 },
  { x: 360, y: 250 },
  { x: 360, y: 350 },
];

/** Inside the triangle above — what selecting the first polygon clicks on. */
const INSIDE_FIRST_POLYGON = { x: 350, y: 300 };

const SECOND_POLYGON = [
  { x: 440, y: 450 },
  { x: 500, y: 450 },
  { x: 500, y: 550 },
];

function controls(page: Page) {
  return {
    draw: page.getByRole("button", { name: "Dibujar un área" }),
    edit: page.getByRole("button", { name: "Seleccionar y editar áreas" }),
    remove: page.getByRole("button", { name: "Eliminar el área seleccionada" }),
    clear: page.getByRole("button", { name: "Eliminar todas las áreas" }),
    status: page.getByRole("group", { name: "Herramientas de dibujo" }).locator("p"),
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

  await expect(status).toHaveText("No hay áreas dibujadas.");
  await expect(edit).toBeDisabled();
  await expect(remove).toBeDisabled();
  await expect(clear).toBeDisabled();
});

test("draws several polygons without leaving draw mode", async ({ page }) => {
  const { draw, edit, clear, status } = controls(page);

  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await expect(status).toHaveText("1 área dibujada.");

  // Still armed: the second polygon needs no trip back to the toolbar.
  await expect(draw).toHaveAttribute("aria-pressed", "true");
  await drawPolygon(page, SECOND_POLYGON);
  await expect(status).toHaveText("2 áreas dibujadas.");

  await expect(edit).toBeEnabled();
  await expect(clear).toBeEnabled();
});

test("deletes one selected polygon and keeps the rest", async ({ page }) => {
  const { draw, edit, remove, status } = controls(page);

  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await drawPolygon(page, SECOND_POLYGON);
  await expect(status).toHaveText("2 áreas dibujadas.");

  await edit.click();
  await expect(remove).toBeDisabled();

  // Selecting is what enables deleting: click inside the first polygon.
  await mapCanvas(page).click({ position: INSIDE_FIRST_POLYGON });
  await expect(remove).toBeEnabled();

  await remove.click();
  await expect(status).toHaveText("1 área dibujada.");
  await expect(remove).toBeDisabled();
});

test("clears every polygon at once", async ({ page }) => {
  const { draw, clear, edit, status } = controls(page);

  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await drawPolygon(page, SECOND_POLYGON);
  await expect(status).toHaveText("2 áreas dibujadas.");

  await clear.click();
  await expect(status).toHaveText("No hay áreas dibujadas.");
  await expect(clear).toBeDisabled();
  await expect(edit).toBeDisabled();
});

// Activating the draw tool starts a session from scratch: whatever was on the map goes.
test("reactivating draw clears the previous session", async ({ page }) => {
  const { draw, status } = controls(page);

  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await expect(status).toHaveText("1 área dibujada.");

  // Toggling off keeps the polygon; toggling back on clears it.
  await draw.click();
  await expect(status).toHaveText("1 área dibujada.");

  await draw.click();
  await expect(draw).toHaveAttribute("aria-pressed", "true");
  await expect(status).toHaveText("No hay áreas dibujadas.");
});

// The geometry is in-memory global state by design: only the camera is persisted, and it
// lives in the URL.
test("loses the drawing on reload", async ({ page }) => {
  const { draw, status } = controls(page);

  await draw.click();
  await drawPolygon(page, FIRST_POLYGON);
  await expect(status).toHaveText("1 área dibujada.");

  await page.reload();

  await expect(controls(page).draw).toBeEnabled();
  await expect(controls(page).status).toHaveText("No hay áreas dibujadas.");
});
