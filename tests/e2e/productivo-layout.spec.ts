import { expect, test, type Page } from '@playwright/test';

import { analyseOnRedesign } from './fixtures/redesign';

test('Riesgo productivo gates its analysis, then shows the actions and widgets in the content column', async ({
  page,
}) => {
  await analyseOnRedesign(page, '/analisis/productivo');

  // Private: the login card stands in for the analysis.
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Exportar informe' })).toHaveCount(0);

  // Stubbed login (`stubAuth`): any credentials open the analysis in place.
  await main.getByLabel('Email').fill('analista@example.com');
  await main.getByLabel('Contraseña').fill('cualquiera');
  await main.getByRole('button', { name: 'Acceder' }).click();
  await expect(main.getByRole('heading', { name: 'Iniciar sesión' })).toBeHidden();

  // Personalizar indicadores beside Exportar informe, then the widgets.
  await expect(main.getByRole('button', { name: 'Personalizar indicadores' })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Exportar informe' })).toBeEnabled();
  await expect(
    main.getByRole('heading', { name: 'Producción base histórica de soja' }),
  ).toBeVisible();

  // The six projection indicators read as one chart, across the content column.
  const projection = main
    .getByRole('heading', {
      name: 'Producción proyectada a escenario pesimista, central y optimista',
    })
    .locator('..')
    .locator('..');
  await expect(projection.getByRole('listitem')).toHaveText([
    'Base histórica: central 3,68 t/ha, pesimista 3,58 t/ha, optimista 3,78 t/ha',
    'Horizonte 5 años: central 3,55 t/ha, pesimista 2,92 t/ha, optimista 4,17 t/ha',
    'Horizonte 10 años: central 3,35 t/ha, pesimista 2,52 t/ha, optimista 4,27 t/ha',
  ]);
  // Hovering a column names its three scenarios; the base is dated by the hero's year.
  const columns = projection.locator('svg rect[fill="transparent"]');
  await columns.nth(0).hover();
  await expect(page.getByRole('tooltip')).toContainText('Base histórica (2026)');
  await columns.nth(1).hover();
  // The base's tooltip may still be fading out: name the one to read.
  const tooltip = page.getByRole('tooltip', { name: /^Horizonte 5 años/ });
  await expect(tooltip).toContainText(
    'Horizonte 5 años' + 'Optimista: 4,17 t/ha' + 'Central: 3,55 t/ha' + 'Pesimista: 2,92 t/ha',
  );
  // Under Todas the header and the legend say how the parcels' values were combined.
  await expect(
    projection.getByText(/^Cada punto combina las parcelas seleccionadas/),
  ).toBeVisible();
  await expect(projection.getByText('[Percentiles 10-90] Rango pesimista-optimista')).toBeVisible();
  await expect(projection.getByText('[Promedio] Central de las parcelas')).toBeVisible();
  await expect(
    main.getByRole('heading', { name: /^Producción proyectada (LOW|MID|HIGH)/ }),
  ).toHaveCount(0);

  // Productivo keeps the picker out of Cultivo y fechas.
  const filters = page.getByRole('region', { name: 'Cultivo y fechas' });
  await filters.getByRole('button', { name: /Cultivo y fechas/ }).click();
  await expect(filters.getByRole('combobox', { name: 'Tipo de cultivo' })).toBeVisible();
  await expect(filters.getByRole('button', { name: 'Personalizar indicadores' })).toHaveCount(0);
});

/** Signs in through the gate card in the content column (stubbed: any credentials). */
async function loginAtGate(page: Page) {
  const main = page.getByRole('main');
  await main.getByLabel('Email').fill('analista@example.com');
  await main.getByLabel('Contraseña').fill('cualquiera');
  await main.getByRole('button', { name: 'Acceder' }).click();
  await expect(main.getByRole('heading', { name: 'Iniciar sesión' })).toBeHidden();
}

function widget(page: Page, name: string) {
  return page.getByRole('main').getByRole('heading', { name }).locator('..').locator('..');
}

test('the productivo widgets read the selection under Todas and one parcel when picked', async ({
  page,
}) => {
  await analyseOnRedesign(page, '/analisis/productivo');
  await loginAtGate(page);

  // Under Todas: the base production bins both parcels' values on a 0–4 t/ha scale, the
  // resilience proxy counts them per class, the seasons count is one bin per value.
  const production = widget(page, 'Producción base histórica de soja');
  await expect(production).toContainText('t/ha');
  await expect(production.getByRole('listitem')).toHaveText(['3,4 – 3,6: 1', '3,8 – 4: 1']);
  const resilience = widget(page, 'Proxy de resiliencia operativa');
  await expect(resilience.getByRole('listitem').filter({ hasText: /^Media: 2$/ })).toHaveCount(1);
  // The projection chart leads, and under Todas every widget takes the full width.
  const projection = widget(
    page,
    'Producción proyectada a escenario pesimista, central y optimista',
  );
  const projectionBox = await projection.boundingBox();
  const todasBoxes = [await production.boundingBox(), await resilience.boundingBox()];
  expect(projectionBox!.y).toBeLessThan(todasBoxes[0]!.y);
  expect(projectionBox!.y).toBeLessThan(todasBoxes[1]!.y);
  expect(todasBoxes[0]!.x).toBe(todasBoxes[1]!.x);
  expect(todasBoxes[0]!.width).toBe(todasBoxes[1]!.width);
  const seasons = widget(page, 'Contador de zafras de soja detectadas');
  await expect(seasons.getByRole('listitem')).toHaveText(['3: 1', '5: 1']);

  // The arroz indicator belongs to the other crop: no widget.
  await expect(
    page.getByRole('heading', { name: 'Producción base histórica de arroz' }),
  ).toHaveCount(0);

  // Picking a parcel narrows the widgets to it; back on Todas the histograms return.
  const parcel = page
    .getByRole('region', { name: 'Área de interés' })
    .getByRole('combobox', { name: 'Parcela' });
  await parcel.click();
  await page.getByRole('option', { name: 'Parcela 2' }).click();
  await expect(production.locator('[data-slot="figure"]')).toHaveText('3,81 t/ha');
  await expect(seasons.locator('[data-slot="figure"]')).toHaveText('3');
  await expect(resilience.locator('[data-slot="risk-level"]')).toHaveText('Media');
  // On one parcel the projection reads its own scenarios; its base is one value.
  await expect(projection.getByRole('listitem')).toHaveText([
    'Base histórica: central 3,81 t/ha, pesimista 3,81 t/ha, optimista 3,81 t/ha',
    'Horizonte 5 años: central 3,7 t/ha, pesimista 3,1 t/ha, optimista 4,2 t/ha',
    'Horizonte 10 años: central 3,5 t/ha, pesimista 2,7 t/ha, optimista 4,3 t/ha',
  ]);
  // One parcel's own scenarios need no method in the legend.
  await expect(projection.getByText('Central de la parcela', { exact: true })).toBeVisible();
  await expect(projection.getByText(/^\[/)).toHaveCount(0);
  await expect(projection.getByText(/^Cada punto combina/)).toHaveCount(0);
  // A parcel tab goes back to columns: the widgets narrow below the full width.
  const parcelBox = await production.boundingBox();
  expect(parcelBox!.width).toBeLessThan(todasBoxes[0]!.width);
  await parcel.click();
  await page.getByRole('option', { name: 'Todas' }).click();
  await expect(production.getByRole('listitem')).toHaveText(['3,4 – 3,6: 1', '3,8 – 4: 1']);
});

test('Generar resumen asks for the open selection, then for one parcel', async ({ page }) => {
  let releaseSummary!: () => void;
  const summaryHeld = new Promise<void>((resolve) => {
    releaseSummary = resolve;
  });
  await analyseOnRedesign(page, '/analisis/productivo', (target) =>
    target.route(
      (url) => url.pathname === '/api/parcels/analysis/summary/',
      async (route) => {
        await summaryHeld;
        await route.fallback();
      },
    ),
  );
  await loginAtGate(page);

  const description = page.getByText('Puede añadir al informe un resumen');
  await expect(description).toBeVisible();
  await page.getByRole('button', { name: 'Generar resumen' }).click();
  await expect(page.getByRole('button', { name: 'Generando' })).toBeDisabled();

  releaseSummary();
  await expect(page.getByRole('heading', { name: 'Resumen de 2 parcelas' })).toBeVisible();
  await expect(page.getByText('Cultivo: soja')).toBeVisible();

  // On one parcel the summary starts over and is asked about that parcel alone.
  const parcel = page
    .getByRole('region', { name: 'Área de interés' })
    .getByRole('combobox', { name: 'Parcela' });
  await parcel.click();
  await page.getByRole('option', { name: 'Parcela 2' }).click();
  await expect(description).toBeVisible();
  await page.getByRole('button', { name: 'Generar resumen' }).click();
  await expect(page.getByRole('heading', { name: 'Resumen de 1 parcelas' })).toBeVisible();
});

test('the gate swaps the login card for the reset request and back', async ({ page }) => {
  await analyseOnRedesign(page, '/analisis/productivo');
  const main = page.getByRole('main');

  await main.getByRole('button', { name: 'Restablecer contraseña' }).click();
  await expect(main.getByRole('heading', { name: 'Restablecer contraseña' })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Acceder' })).toBeHidden();

  // Solicitar hands off to the mail client and confirms with the email.
  await main.getByLabel('Email').fill('ana@example.org');
  await main.getByRole('button', { name: 'Solicitar' }).click();
  await expect(main.getByRole('heading', { name: 'Solicitud enviada' })).toBeVisible();
  await expect(page).toHaveURL(/\/analisis\/productivo/);
});
