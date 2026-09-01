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
    analyze: page.getByRole('button', { name: 'Analizar' }),
  };
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

  // The MultiPolygon became two parts (3 areas from 2 polygon features); the lone
  // point became a warning.
  await expect(uploadStatus).toHaveText('Se importaron 3 áreas de farms.geojson.');
  await expect(notices).toContainText('Se omitió 1 entidad que no es un polígono.');
});

// Both replacements at once: an upload clears the drawn polygons, and the next upload
// clears the previous one. Only the analysis page lists the areas now, so that is
// where the surviving names are asserted.
test('an upload replaces everything already on the map', async ({ page }) => {
  const { uploadStatus, analyze } = controls(page);

  await page.getByRole('button', { name: 'Dibujar polígono' }).click();
  await drawPolygon(page, DRAWN_POLYGON);
  await expect(analyze).toBeEnabled();

  await upload(page, 'farms.geojson');
  await expect(uploadStatus).toHaveText('Se importaron 3 áreas de farms.geojson.');

  await upload(page, 'farms.kml');
  await expect(uploadStatus).toHaveText('Se importaron 2 áreas de farms.kml.');

  await analyze.click();
  await expect(page).toHaveURL(/\/analisis/);

  // Only the last upload made it: the drawn polygon and the GeoJSON areas are gone.
  const areas = page.getByRole('list').getByRole('listitem');
  await expect(areas).toHaveText(['Estancia KML', 'Campo KML']);
});

test('imports a KMZ with names from the KML inside', async ({ page }) => {
  const { uploadStatus } = controls(page);

  await upload(page, 'farms.kmz');

  await expect(uploadStatus).toHaveText('Se importaron 2 áreas de farms.kmz.');
});

test('imports a UTM 21S shapefile, reprojected via its .prj', async ({ page }) => {
  const { uploadStatus } = controls(page);

  await upload(page, 'farms-utm21s.zip');

  await expect(uploadStatus).toHaveText('Se importaron 2 áreas de farms-utm21s.zip.');
});

test('skips holed polygons with a warning naming them', async ({ page }) => {
  const { uploadStatus, notices } = controls(page);

  await upload(page, 'farms-holes.geojson');

  await expect(uploadStatus).toHaveText('Se importó 1 área de farms-holes.geojson.');
  await expect(notices).toContainText('"Laguna Grande" tiene anillos interiores (huecos)');

  await notices.getByRole('button', { name: 'Descartar los avisos de subida' }).click();
  await expect(notices).toBeHidden();
});

// An upload starts the selection over even when it fails: the previous polygons go
// regardless of whether anything from the new file lands.
test('a failed upload clears the polygons already on the map', async ({ page }) => {
  const { notices, analyze } = controls(page);

  await upload(page, 'farms.geojson');
  await expect(analyze).toBeEnabled();

  await upload(page, 'points.geojson');

  await expect(notices).toContainText(
    'El archivo no contiene polígonos importables — se encontraron 2 puntos.',
  );
  // Analizar disarming is the signal that the previous polygons went too.
  await expect(analyze).toBeDisabled();
});

test('accepted upload polygons can be analysed', async ({ page }) => {
  const { analyze } = controls(page);

  // Nothing on the map yet: analysis has nothing to send.
  await expect(analyze).toBeDisabled();

  await upload(page, 'farms.geojson');
  await expect(analyze).toBeEnabled();

  await analyze.click();
  await expect(page).toHaveURL(/\/analisis/);

  // The submitted areas are listed on the analysis page under their upload names.
  const areas = page.getByRole('list').getByRole('listitem');
  await expect(areas).toHaveText(['Estancia Norte (1/2)', 'Estancia Norte (2/2)', 'Campo Sur']);
});

// The copy borrows the no-intersection toast until the real intersection check.
test('rejects an upload outside Paraguay with a warning', async ({ page }) => {
  const { upload: uploadButton, notices, analyze } = controls(page);

  await upload(page, 'farms-outside-paraguay.geojson');

  await expect(notices).toContainText(
    'El polígono que ha dibujado no toca el área de ninguna parcela.',
  );
  await expect(analyze).toBeDisabled();

  // The entry point that caused the error is outlined until the toast is dismissed.
  // Token-anchored: the base variant carries `aria-invalid:border-destructive`.
  await expect(uploadButton).toHaveClass(/(^| )border-destructive( |$)/);
  await notices.getByRole('button', { name: 'Descartar los avisos de subida' }).click();
  await expect(uploadButton).not.toHaveClass(/(^| )border-destructive( |$)/);
});

// Format and size failures show the generic help toast — what to fix — instead of the
// parser's message.
test('a file over 10 MB shows the format and size help toast', async ({ page }) => {
  const { input, notices } = controls(page);

  await input.setInputFiles({
    name: 'demasiado-grande.geojson',
    mimeType: 'application/geo+json',
    buffer: Buffer.alloc(10 * 1024 * 1024 + 1, 0x20),
  });

  await expect(notices).toContainText('Ha habido un error.');
  await expect(notices).toContainText('Tamaño máximo recomendado: 10 MB.');
  await expect(notices).toContainText('Formatos compatibles:');
});

test('an unsupported extension shows the format and size help toast', async ({ page }) => {
  const { input, notices } = controls(page);

  await input.setInputFiles({
    name: 'notas.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('no soy un polígono'),
  });

  await expect(notices).toContainText('Ha habido un error.');
  await expect(notices).toContainText('Formatos compatibles:');

  // The drawing how-to yields its spot to the toast, and returns on dismiss.
  const instructions = page.getByText('Haga clic para comenzar el polígono');
  await expect(instructions).toBeHidden();

  await notices.getByRole('button', { name: 'Descartar los avisos de subida' }).click();
  await expect(notices).toBeHidden();
  await expect(instructions).toBeVisible();
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
  await expect(controls(page).analyze).toBeEnabled();

  await page.reload();

  await expect(controls(page).upload).toBeEnabled();
  await expect(controls(page).analyze).toBeDisabled();
});
