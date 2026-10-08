import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test, type Page } from '@playwright/test';

import { stubAnalysisApi } from './fixtures/api';
import { mapCanvas, stubBasemap } from './fixtures/map';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'uploads');

// A phone: below the `md` breakpoint, where the panel and the map take turns.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

function controls(page: Page) {
  return {
    heading: page.getByRole('heading', { name: 'Selección de parcelas' }),
    upload: page.getByRole('button', { name: 'Subir archivo' }),
    draw: page.getByRole('button', { name: 'Dibujar polígono' }),
    cancel: page.getByRole('button', { name: 'Cancelar' }),
    input: page.locator('input[type="file"]'),
    uploadStatus: page.getByRole('status', { name: 'Estado de la selección' }),
    analyze: page.getByRole('button', { name: 'Analizar' }),
    restart: page.getByRole('button', { name: 'Reiniciar' }),
  };
}

test.beforeEach(async ({ page }) => {
  await stubBasemap(page);
  await stubAnalysisApi(page);
  await page.goto('/');

  // The map mounts under the panel, so Terra Draw binds while the panel is up.
  await expect(controls(page).upload).toBeEnabled();
});

test('starts on the panel, with the map out of sight', async ({ page }) => {
  const { heading, upload, draw, analyze } = controls(page);

  await expect(heading).toBeVisible();
  await expect(upload).toBeVisible();
  await expect(draw).toBeVisible();
  await expect(mapCanvas(page)).toBeHidden();
  await expect(analyze).toBeHidden();
});

test('an upload hands the screen to the map, with Reiniciar and Analizar under it', async ({
  page,
}) => {
  const { heading, input, uploadStatus, analyze, restart } = controls(page);

  await input.setInputFiles(join(FIXTURES, 'farms.geojson'));

  await expect(uploadStatus).toHaveText('Se importaron 3 áreas de farms.geojson.');
  await expect(mapCanvas(page)).toBeVisible();
  await expect(heading).toBeHidden();
  await expect(restart).toBeVisible();
  await expect(analyze).toBeEnabled();

  // Reiniciar clears the areas: back to the panel.
  await restart.click();
  await expect(heading).toBeVisible();
  await expect(mapCanvas(page)).toBeHidden();

  await input.setInputFiles(join(FIXTURES, 'farms.kml'));
  await expect(analyze).toBeEnabled();
  await analyze.click();
  await expect(page).toHaveURL(/\/analisis/);
});

test('Dibujar polígono shows the map with Subir archivo and Cancelar; Cancelar comes back', async ({
  page,
}) => {
  const { heading, draw, upload, cancel } = controls(page);

  await draw.click();

  await expect(mapCanvas(page)).toBeVisible();
  await expect(heading).toBeHidden();
  await expect(upload).toBeVisible();
  await expect(cancel).toBeVisible();

  await cancel.click();
  await expect(heading).toBeVisible();
  await expect(draw).toBeVisible();
  await expect(mapCanvas(page)).toBeHidden();
});
