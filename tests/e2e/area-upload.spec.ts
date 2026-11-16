import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test, type Page } from '@playwright/test';

import { PARAGUAY_VIEW_STATE } from '../../src/lib/map/view-state';
import { stubAnalysisApi } from './fixtures/api';
import { cameraUrl, mapCanvas, stubBasemap } from './fixtures/map';
import { savedPolygonCount } from './fixtures/saved-selection';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'uploads');

function controls(page: Page) {
  const area = page.getByRole('region', { name: 'Área de interés' });

  return {
    area,
    upload: area.getByRole('button', { name: 'Subir archivo' }),
    input: area.locator('input[type="file"]'),
    uploadStatus: area.getByRole('status', { name: 'Estado de la selección' }),
    notices: page.getByRole('region', { name: 'Avisos de subida' }),
    // Only once an area is on the map.
    analyze: area.getByRole('button', { name: 'Analizar' }),
    restart: area.getByRole('button', { name: 'Reiniciar' }),
    parcel: area.getByRole('combobox', { name: 'Parcela' }),
  };
}

async function upload(page: Page, fixture: string) {
  await controls(page).input.setInputFiles(join(FIXTURES, fixture));
}

test.beforeEach(async ({ page }) => {
  await stubBasemap(page);
  await stubAnalysisApi(page);
  await page.goto(cameraUrl(PARAGUAY_VIEW_STATE, '/analisis/sanitario'));

  // Terra Draw starts on the style's `load` event; Subir archivo is disabled until it has.
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

  // The camera flies to the imported areas, between the two farms (59.4°W and 56.9°W).
  await expect.poll(() => Number(new URL(page.url()).searchParams.get('lng'))).toBeLessThan(-57);
});

test('Reiniciar clears an upload so the next one starts fresh', async ({ page }) => {
  const { uploadStatus, analyze, restart, parcel } = controls(page);

  await upload(page, 'farms.geojson');
  await expect(uploadStatus).toHaveText('Se importaron 3 áreas de farms.geojson.');
  await expect(analyze).toBeEnabled();

  await restart.click();
  await expect(analyze).toBeHidden();

  await upload(page, 'farms.kml');
  await expect(uploadStatus).toHaveText('Se importaron 2 áreas de farms.kml.');

  // Only the last upload made it, and the analysis goes through in place.
  await analyze.click();
  await expect(parcel).toHaveText('Todas');
});

test('imports a KMZ with names from the KML inside', async ({ page }) => {
  await upload(page, 'farms.kmz');

  await expect(controls(page).uploadStatus).toHaveText('Se importaron 2 áreas de farms.kmz.');
});

test('imports a UTM 21S shapefile, reprojected via its .prj', async ({ page }) => {
  await upload(page, 'farms-utm21s.zip');

  await expect(controls(page).uploadStatus).toHaveText(
    'Se importaron 2 áreas de farms-utm21s.zip.',
  );
});

test('a failed upload shows its error and offers no Analizar', async ({ page }) => {
  const { notices, analyze } = controls(page);

  await upload(page, 'points.geojson');

  await expect(notices).toContainText(
    'El archivo no contiene polígonos importables — se encontraron 2 puntos.',
  );
  await expect(analyze).toBeHidden();
});

test('rejects an upload outside Paraguay with a warning', async ({ page }) => {
  const { notices, analyze } = controls(page);

  await upload(page, 'farms-outside-paraguay.geojson');

  await expect(notices).toContainText('El archivo contiene geometría fuera de Paraguay');
  await expect(analyze).toBeHidden();

  await notices.getByRole('button', { name: 'Descartar los avisos de subida' }).click();
  await expect(notices).toBeHidden();
});

// A country-sized polygon is measured while parsing: the file fails with the hectares,
// nothing lands and `filter-parcels` is never asked.
test('a file over the area limit fails with the hectares, without asking the API', async ({
  page,
}) => {
  const { notices, analyze } = controls(page);

  let requests = 0;
  await page.route(
    (url) => url.pathname === '/api/parcels/filter-parcels/',
    (route) => {
      requests += 1;

      return route.fallback();
    },
  );

  await upload(page, 'farms-oversized.geojson');

  await expect(notices).toContainText('Ha habido un error.');
  await expect(notices).toContainText(/supera el máximo de 200\.000 ha/);
  await expect(analyze).toBeHidden();
  expect(requests).toBe(0);
});

// Format and size failures show the help toast — what to fix — instead of the parser's message.
test('a file over 10 MB shows the format and size help', async ({ page }) => {
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

test('an unsupported extension shows the format and size help', async ({ page }) => {
  const { input, notices } = controls(page);

  await input.setInputFiles({
    name: 'notas.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('no soy un polígono'),
  });

  await expect(notices).toContainText('Formatos compatibles:');
});

test('rejects a corrupt zip with a readable error', async ({ page }) => {
  await upload(page, 'corrupt.zip');

  await expect(controls(page).notices).toContainText(
    'No se pudo leer el archivo como archivo zip.',
  );
});

// Uploaded areas are saved like drawn ones; Reiniciar removes the record too.
test('keeps the upload across a reload, and Reiniciar forgets it', async ({ page }) => {
  await upload(page, 'farms.geojson');
  await expect(controls(page).analyze).toBeEnabled();
  await expect.poll(() => savedPolygonCount(page)).toBeGreaterThan(0);

  await page.reload();
  await expect(controls(page).analyze).toBeEnabled();

  await controls(page).restart.click();
  await expect(controls(page).analyze).toBeHidden();
  await expect.poll(() => savedPolygonCount(page)).toBe(0);

  await page.reload();
  await expect(controls(page).upload).toBeEnabled();
  await expect(controls(page).analyze).toBeHidden();
});
