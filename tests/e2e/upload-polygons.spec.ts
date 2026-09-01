import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test, type Page } from '@playwright/test';

import { drawPolygon, mapCanvas, stubBasemap } from './fixtures/map';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'uploads');

/** Clear of every overlay and of the uploaded polygons; from `draw.spec.ts`. */
const DRAWN_POLYGON = [
  { x: 440, y: 450 },
  { x: 500, y: 450 },
  { x: 500, y: 550 },
];

function controls(page: Page) {
  return {
    upload: page.getByRole('button', { name: 'Subir archivo' }),
    input: page.locator('input[type="file"]'),
    // The upload outcome announces from the panel, next to the button that caused it.
    uploadStatus: page
      .getByRole('group', { name: 'Seleccionar parcelas para análisis' })
      .locator('p'),
    notices: page.getByRole('region', { name: 'Avisos de subida' }),
  };
}

function areaButton(page: Page, name: string) {
  return page.getByRole('button', { name, exact: true });
}

async function upload(page: Page, fixture: string) {
  await controls(page).input.setInputFiles(join(FIXTURES, fixture));
}

test.beforeEach(async ({ page }) => {
  await stubBasemap(page);
  await page.goto('/');

  // Terra Draw starts on the style's `load` event; the Upload button is disabled until
  // it has, and waiting on that is what makes the rest of the spec deterministic.
  await expect(controls(page).upload).toBeEnabled();
  await expect(mapCanvas(page)).toBeVisible();
});

test('imports a GeoJSON upload, exploding its MultiPolygon', async ({ page }) => {
  const { uploadStatus, notices } = controls(page);

  await upload(page, 'farms.geojson');

  await expect(uploadStatus).toHaveText('Se importaron 3 áreas de farms.geojson.');

  // The MultiPolygon became two named parts; the lone point became a warning.
  await expect(areaButton(page, 'Estancia Norte (1/2)')).toBeVisible();
  await expect(areaButton(page, 'Estancia Norte (2/2)')).toBeVisible();
  await expect(areaButton(page, 'Campo Sur')).toBeVisible();
  await expect(notices).toContainText('Se omitió 1 entidad que no es un polígono.');

  // The first polygon is auto-selected for the analysis highlight.
  await expect(areaButton(page, 'Estancia Norte (1/2)')).toHaveAttribute('aria-pressed', 'true');
});

test('switches the analysis selection from the list', async ({ page }) => {
  await upload(page, 'farms.geojson');

  await areaButton(page, 'Campo Sur').click();

  await expect(areaButton(page, 'Campo Sur')).toHaveAttribute('aria-pressed', 'true');
  await expect(areaButton(page, 'Estancia Norte (1/2)')).toHaveAttribute('aria-pressed', 'false');
});

// Both replacements at once: an upload clears the drawn polygons, and the next upload
// clears the previous one.
test('an upload replaces everything already on the map', async ({ page }) => {
  const { uploadStatus } = controls(page);

  await page.getByRole('button', { name: 'Dibujar polígono' }).click();
  await drawPolygon(page, DRAWN_POLYGON);
  await expect(areaButton(page, 'Área dibujada 1')).toBeVisible();

  await upload(page, 'farms.geojson');

  await expect(uploadStatus).toHaveText('Se importaron 3 áreas de farms.geojson.');
  await expect(areaButton(page, 'Área dibujada 1')).toBeHidden();
  await expect(areaButton(page, 'Campo Sur')).toBeVisible();

  await upload(page, 'farms.kml');

  await expect(uploadStatus).toHaveText('Se importaron 2 áreas de farms.kml.');
  await expect(areaButton(page, 'Estancia KML')).toBeVisible();
  await expect(areaButton(page, 'Campo KML')).toBeVisible();
  await expect(areaButton(page, 'Campo Sur')).toBeHidden();
});

test('imports a KMZ with names from the KML inside', async ({ page }) => {
  const { uploadStatus } = controls(page);

  await upload(page, 'farms.kmz');

  await expect(uploadStatus).toHaveText('Se importaron 2 áreas de farms.kmz.');
  await expect(areaButton(page, 'Estancia KML')).toBeVisible();
  await expect(areaButton(page, 'Campo KML')).toBeVisible();
});

test('imports a UTM 21S shapefile, reprojected via its .prj', async ({ page }) => {
  const { uploadStatus } = controls(page);

  await upload(page, 'farms-utm21s.zip');

  await expect(uploadStatus).toHaveText('Se importaron 2 áreas de farms-utm21s.zip.');
  await expect(areaButton(page, 'Estancia San Pedro')).toBeVisible();
  await expect(areaButton(page, 'Campo Verde')).toBeVisible();
});

test('skips holed polygons with a warning naming them', async ({ page }) => {
  const { uploadStatus, notices } = controls(page);

  await upload(page, 'farms-holes.geojson');

  await expect(uploadStatus).toHaveText('Se importó 1 área de farms-holes.geojson.');
  await expect(notices).toContainText('"Laguna Grande" tiene anillos interiores (huecos)');
  await expect(areaButton(page, 'Potrero')).toBeVisible();

  await notices.getByRole('button', { name: 'Descartar los avisos de subida' }).click();
  await expect(notices).toBeHidden();
});

test('a failed upload keeps the polygons already on the map', async ({ page }) => {
  const { notices } = controls(page);

  await upload(page, 'farms.geojson');
  await expect(areaButton(page, 'Campo Sur')).toBeVisible();

  await upload(page, 'points.geojson');

  await expect(notices).toContainText(
    'El archivo no contiene polígonos importables — se encontraron 2 puntos.',
  );
  await expect(areaButton(page, 'Campo Sur')).toBeVisible();
});

// Acceptance: once uploaded polygons are on the map, Analizar arms and submits them.
test('accepted upload polygons can be analysed', async ({ page }) => {
  const analyze = page.getByRole('button', { name: 'Analizar' });

  // Nothing on the map yet: analysis has nothing to send.
  await expect(analyze).toBeDisabled();

  await upload(page, 'farms.geojson');
  await expect(areaButton(page, 'Campo Sur')).toBeVisible();
  await expect(analyze).toBeEnabled();

  await analyze.click();
  await expect(page).toHaveURL(/\/analisis/);

  // The submitted areas are listed on the analysis page under their upload names.
  const areas = page.getByRole('list').getByRole('listitem');
  await expect(areas).toHaveText(['Estancia Norte (1/2)', 'Estancia Norte (2/2)', 'Campo Sur']);
});

// Acceptance: geometry outside Paraguay is wrong data — the file is rejected whole,
// with a warning the user can read, and nothing new to analyse.
test('rejects an upload outside Paraguay with a warning', async ({ page }) => {
  const { notices } = controls(page);
  const analyze = page.getByRole('button', { name: 'Analizar' });

  await upload(page, 'farms-outside-paraguay.geojson');

  await expect(notices).toContainText(
    'El archivo contiene geometría fuera de Paraguay — esta plataforma solo analiza áreas dentro del país.',
  );
  await expect(areaButton(page, 'Estancia Bonaerense')).toBeHidden();
  await expect(analyze).toBeDisabled();
});

test('rejects a corrupt zip with a readable error', async ({ page }) => {
  const { notices } = controls(page);

  await upload(page, 'corrupt.zip');

  await expect(notices).toContainText('No se pudo leer el archivo como archivo zip.');
});

// Uploads live in the same in-memory store as drawn polygons, and only the camera is
// persisted — so a reload clears them, consistently with `draw.spec.ts`.
test('loses the upload on reload', async ({ page }) => {
  await upload(page, 'farms.geojson');
  await expect(areaButton(page, 'Campo Sur')).toBeVisible();

  await page.reload();

  await expect(controls(page).upload).toBeEnabled();
  await expect(areaButton(page, 'Campo Sur')).toBeHidden();
});
