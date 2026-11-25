import { expect, test, type Page } from '@playwright/test';

import { EAST_PARCEL_ID, stubFilterParcels, WEST_PARCEL_ID } from './fixtures/api';
import { analyseOnRedesign } from './fixtures/redesign';

/** The hero's year, the first the API offers (`NEXT_YEAR` in the fixture); it names the projection's base. */
const YEAR = String(new Date().getFullYear() + 1);

test('Riesgo productivo gates its analysis, then shows the actions and widgets in the content column', async ({
  page,
}) => {
  await analyseOnRedesign(page, '/analisis/productivo');

  // Private: the login modal opens over an empty content column, no login page.
  const main = page.getByRole('main');
  const login = page.getByRole('dialog', { name: 'Iniciar sesión' });
  await expect(login).toBeVisible();
  await expect(main.getByRole('heading', { name: 'Iniciar sesión' })).toHaveCount(0);
  await expect(main.getByRole('button', { name: 'Exportar informe' }).first()).toHaveCount(0);

  // Stubbed login (`stubAuth`): any credentials open the analysis in place.
  await login.getByLabel('Email').fill('analista@example.com');
  await login.getByLabel('Contraseña').fill('cualquiera');
  await login.getByRole('button', { name: 'Acceder' }).click();
  await expect(login).toBeHidden();

  // Personalizar indicadores beside Exportar informe, then the widgets.
  await expect(
    main.getByRole('button', { name: 'Personalizar indicadores' }).first(),
  ).toBeVisible();
  await expect(main.getByRole('button', { name: 'Exportar informe' }).first()).toBeEnabled();
  await expect(
    main.getByRole('heading', { name: 'Producción base histórica de soja' }),
  ).toBeVisible();

  // The six projection indicators read as one chart, across the content column.
  const projection = main
    .getByRole('heading', {
      name: 'Producción proyectada a escenario pesimista, neutro y optimista',
    })
    .locator('..')
    .locator('..');
  await expect(projection.getByRole('listitem')).toHaveText([
    `${YEAR}: neutro 3,68 t/ha, pesimista 3,58 t/ha, optimista 3,78 t/ha`,
    'Horizonte 5 años: neutro 3,55 t/ha, pesimista 2,92 t/ha, optimista 4,17 t/ha',
    'Horizonte 10 años: neutro 3,35 t/ha, pesimista 2,52 t/ha, optimista 4,27 t/ha',
  ]);
  // Hovering a column names its three scenarios; the base is named by the hero's year.
  const columns = projection.locator('svg rect[fill="transparent"]');
  await columns.nth(0).hover();
  await expect(page.getByRole('tooltip')).toContainText(YEAR);
  await columns.nth(1).hover();
  // The base's tooltip may still be fading out: name the one to read.
  const tooltip = page.getByRole('tooltip', { name: /^Horizonte 5 años/ });
  await expect(tooltip).toContainText(
    'Horizonte 5 años' + 'Optimista: 4,17 t/ha' + 'Neutro: 3,55 t/ha' + 'Pesimista: 2,92 t/ha',
  );
  // Under Todas the header and the legend say how the parcels' values were combined.
  await expect(
    projection.getByText(/^Cada punto combina las parcelas seleccionadas/),
  ).toBeVisible();
  await expect(projection.getByText('[Percentiles 10-90] Rango pesimista-optimista')).toBeVisible();
  await expect(projection.getByText('[Promedio] Neutro de las parcelas')).toBeVisible();
  await expect(
    main.getByRole('heading', { name: /^Producción proyectada (LOW|MID|HIGH)/ }),
  ).toHaveCount(0);

  // Personalizar lists the projection as one row, not six; unticking it drops the chart.
  await main.getByRole('button', { name: 'Personalizar indicadores' }).first().click();
  const indicators = page.getByRole('list', { name: 'Indicadores' });
  await expect(indicators.getByText(/^Producción proyectada/)).toHaveText([
    'Producción proyectada a 5 y 10 años',
  ]);
  await indicators.getByText(/^Producción proyectada/).click();
  await expect(projection).toHaveCount(0);
  await indicators.getByText(/^Producción proyectada/).click();
  await expect(projection.getByRole('listitem')).toHaveCount(3);
  await page.keyboard.press('Escape');

  // The text facts share one context card, as on sanitario; under Todas it heads the
  // Información de contexto section, which titles it.
  const context = main.getByRole('region', { name: 'Información de contexto' }).locator('dl');
  await expect(context).toContainText('Tipo de cultivo');
  await expect(context).toContainText('Soja');

  // Productivo keeps the picker out of Cultivo y fechas.
  const filters = page.getByRole('region', { name: 'Cultivo y fechas' });
  await filters.getByRole('button', { name: /Cultivo y fechas/ }).click();
  await expect(filters.getByRole('combobox', { name: 'Tipo de cultivo' })).toBeVisible();
  // The year is shown, not picked: the current one, read-only, and no dropdown for it.
  const year = filters.getByRole('textbox', { name: 'Año' });
  await expect(year).toHaveValue(YEAR);
  await expect(year).toHaveAttribute('readonly', '');
  await expect(filters.getByRole('combobox', { name: 'Año' })).toHaveCount(0);
  await expect(filters.getByRole('button', { name: 'Personalizar indicadores' })).toHaveCount(0);
});

/** Signs in through the login modal the page opens (stubbed: any credentials). */
async function loginAtGate(page: Page) {
  const login = page.getByRole('dialog', { name: 'Iniciar sesión' });
  await login.getByLabel('Email').fill('analista@example.com');
  await login.getByLabel('Contraseña').fill('cualquiera');
  await login.getByRole('button', { name: 'Acceder' }).click();
  await expect(login).toBeHidden();
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
  // Resiliencia is context: under Todas it sits in Información de contexto, after the facts.
  await expect(page.getByRole('region', { name: 'Información de contexto' })).toContainText(
    'Proxy de resiliencia operativa',
  );
  // The projection chart is future, so it follows the agnostic and historic widgets; under
  // Todas every widget takes the full width.
  const projection = widget(
    page,
    'Producción proyectada a escenario pesimista, neutro y optimista',
  );
  const projectionBox = await projection.boundingBox();
  const todasBoxes = [await production.boundingBox(), await resilience.boundingBox()];
  expect(projectionBox!.y).toBeGreaterThan(todasBoxes[0]!.y);
  expect(projectionBox!.y).toBeGreaterThan(todasBoxes[1]!.y);
  expect(todasBoxes[0]!.x).toBe(todasBoxes[1]!.x);
  expect(todasBoxes[0]!.width).toBe(todasBoxes[1]!.width);
  // Each category's run sits under its title: historic, then projected.
  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    'Información de contexto',
    'Análisis histórico de productividad',
    'Análisis de productividad proyectada',
  ]);
  await expect(
    page.getByRole('region', { name: 'Análisis de productividad proyectada' }),
  ).toContainText('Producción proyectada a escenario pesimista, neutro y optimista');
  // The seasons counter is context too: under Todas, a widget in Información de contexto.
  const seasons = widget(page, 'Contador de zafras de soja detectadas');
  await expect(seasons.getByRole('listitem')).toHaveText(['3: 1', '5: 1']);
  await expect(page.getByRole('region', { name: 'Información de contexto' })).toContainText(
    'Contador de zafras de soja detectadas',
  );
  // Información de contexto sums the area.
  // The facts list itself: under Todas the section titles it, on a parcel the card does.
  // On screen only: the report's Parámetros del análisis holds a print-only list too.
  const info = page.getByRole('main').locator('dl:visible');
  await expect(info).toContainText('17,5 ha');
  // The soy seasons are charted there over the years, each as tall as its parcels; the
  // seasons grown are listed for assistive tech, the one nobody grew (2021-2022) left out.
  const zafras = widget(page, 'Listado de zafras de soja');
  await expect(page.getByRole('region', { name: 'Información de contexto' })).toContainText(
    'Listado de zafras de soja',
  );
  await expect(info.getByRole('term').filter({ hasText: 'Listado de zafras de soja' })).toHaveCount(
    0,
  );
  await expect(zafras.getByRole('listitem')).toHaveText([
    '2017-2018: 1 parcela',
    '2018-2019: 1 parcela',
    '2019-2020: 1 parcela',
    '2020-2021: 1 parcela',
    '2022-2023: 2 parcelas',
    '2023-2024: 1 parcela',
    '2024-2025: 1 parcela',
  ]);
  await expect(zafras.locator('svg text')).toContainText(['2017', '2025']);

  // The arroz indicator belongs to the other crop: no widget.
  await expect(
    page.getByRole('heading', { name: 'Producción base histórica de arroz' }),
  ).toHaveCount(0);

  // Picking a parcel narrows the widgets to it; back on Todas the histograms return.
  const parcel = page
    .getByRole('region', { name: 'Área de interés' })
    .getByRole('combobox', { name: 'Parcela' });
  await parcel.click();
  // The search narrows the list by label (or cadastral id).
  await page.getByRole('searchbox', { name: 'Buscar parcela' }).fill('parcela 2');
  await expect(page.getByRole('option')).toHaveText(['Parcela 2']);
  const todas = page.getByRole('region', { name: 'Área de interés' }).getByRole('button', {
    name: 'Todas',
  });
  await expect(todas).toHaveCount(0);
  await page.getByRole('option', { name: 'Parcela 2' }).click();
  await expect(production.locator('[data-slot="figure"]')).toHaveText('3,81 t/ha');
  // One parcel open: Todas comes back as a button, the way back to the whole selection.
  await expect(todas).toBeVisible();
  // Reopened, the search starts empty and the picked parcel is marked.
  await parcel.click();
  await expect(page.getByRole('searchbox', { name: 'Buscar parcela' })).toHaveValue('');
  await expect(page.getByRole('option', { name: 'Parcela 2' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.keyboard.press('Escape');
  // One parcel's resilience and seasons count read in the context panel instead.
  await expect(resilience).toHaveCount(0);
  await expect(seasons).toHaveCount(0);
  await expect(
    info.getByRole('term').filter({ hasText: 'Proxy de resiliencia operativa' }),
  ).toBeVisible();
  await expect(
    info.getByRole('term').filter({ hasText: 'Contador de zafras de soja detectadas' }),
  ).toBeVisible();
  await expect(info).toContainText('7,3 ha');
  await expect(info).toContainText('2022-2023, 2023-2024, 2024-2025');
  // On one parcel the projection reads its own scenarios; its base is one value.
  await expect(projection.getByRole('listitem')).toHaveText([
    `${YEAR}: neutro 3,81 t/ha, pesimista 3,81 t/ha, optimista 3,81 t/ha`,
    'Horizonte 5 años: neutro 3,7 t/ha, pesimista 3,1 t/ha, optimista 4,2 t/ha',
    'Horizonte 10 años: neutro 3,5 t/ha, pesimista 2,7 t/ha, optimista 4,3 t/ha',
  ]);
  // One parcel's own scenarios need no method in the legend.
  await expect(projection.getByText('Neutro de la parcela', { exact: true })).toBeVisible();
  await expect(projection.getByText(/^\[/)).toHaveCount(0);
  await expect(projection.getByText(/^Cada punto combina/)).toHaveCount(0);
  // A parcel tab goes back to columns: the widgets narrow below the full width.
  const parcelBox = await production.boundingBox();
  expect(parcelBox!.width).toBeLessThan(todasBoxes[0]!.width);
  // The Todas button goes back to the whole selection, and goes away.
  await todas.click();
  await expect(production.getByRole('listitem')).toHaveText(['3,4 – 3,6: 1', '3,8 – 4: 1']);
  await expect(todas).toHaveCount(0);
  // Todas is also the picker's first option.
  await parcel.click();
  await expect(page.getByRole('option', { name: 'Todas' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.keyboard.press('Escape');
});

test('Tipo de cultivo starts at the crop the parcels in view last grew', async ({ page }) => {
  const crops: (string | undefined)[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/parcels/analysis/production/') {
      crops.push((request.postDataJSON() as { crop_type?: string }).crop_type);
    }
  });
  await analyseOnRedesign(page, '/analisis/productivo', (target) =>
    stubFilterParcels(target, { [WEST_PARCEL_ID]: 'Soja', [EAST_PARCEL_ID]: 'Arroz' }),
  );
  await loginAtGate(page);

  // One settings section is open at a time: Cultivo y fechas holds the crop, Área de
  // interés the parcel tabs, and opening one closes the other.
  const crop = page
    .getByRole('region', { name: 'Cultivo y fechas' })
    .getByRole('combobox', { name: 'Tipo de cultivo' });
  const pickParcel = async (name: string) => {
    await openSection(page, 'Área de interés');
    await page
      .getByRole('region', { name: 'Área de interés' })
      .getByRole('combobox', { name: 'Parcela' })
      .click();
    await page.getByRole('option', { name }).click();
  };

  // Under Todas one soy parcel and one rice parcel tie: soy, the platform's default.
  await openSection(page, 'Cultivo y fechas');
  await expect(crop).toHaveText('Soja');

  // The east parcel last grew rice: its tab starts there, and the analysis asks for rice.
  await pickParcel('Parcela 2');
  await expect.poll(() => crops.at(-1)).toBe('arroz');
  await openSection(page, 'Cultivo y fechas');
  await expect(crop).toHaveText('Arroz');

  // A pick outlasts the default.
  await crop.click();
  await page.getByRole('option', { name: 'Soja' }).click();
  await pickParcel('Parcela 1');
  await pickParcel('Parcela 2');
  await openSection(page, 'Cultivo y fechas');
  await expect(crop).toHaveText('Soja');

  // The dropdown offers Todos and every crop; Todos asks once per crop.
  await crop.click();
  await expect(page.getByRole('option')).toHaveText(['Todos', 'Arroz', 'Soja']);
  const before = crops.length;
  await page.getByRole('option', { name: 'Todos' }).click();
  await expect(crop).toHaveText('Todos');
  await expect.poll(() => crops.slice(before).toSorted()).toEqual(['arroz', 'soja']);
});

/** Opens a settings section unless it already is (its trigger would close it). */
async function openSection(page: Page, name: string) {
  const trigger = page
    .getByRole('region', { name })
    .getByRole('button', { name: new RegExp(`^${name}`) });
  if ((await trigger.getAttribute('aria-expanded')) !== 'true') await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
}

test('Generar resumen asks for the open selection, starts over on a new crop, then asks for one parcel', async ({
  page,
}) => {
  let releaseSummary!: () => void;
  const summaryHeld = new Promise<void>((resolve) => {
    releaseSummary = resolve;
  });
  await analyseOnRedesign(page, '/analisis/productivo', async (target) => {
    await stubFilterParcels(target, { [WEST_PARCEL_ID]: 'Soja', [EAST_PARCEL_ID]: 'Arroz' });
    await target.route(
      (url) => url.pathname === '/api/parcels/analysis/summary/',
      async (route) => {
        await summaryHeld;
        await route.fallback();
      },
    );
  });
  await loginAtGate(page);

  const description = page.getByText('Puede añadir al informe un resumen');
  await expect(description).toBeVisible();
  await page.getByRole('button', { name: 'Generar resumen' }).click();
  await expect(page.getByRole('button', { name: 'Generando' })).toBeDisabled();

  releaseSummary();
  await expect(page.getByRole('heading', { name: 'Resumen de 2 parcelas' })).toBeVisible();
  await expect(page.getByText('Cultivo: soja')).toBeVisible();

  // Another crop: the soy summary no longer describes the analysis, so it goes.
  await openSection(page, 'Cultivo y fechas');
  await page
    .getByRole('region', { name: 'Cultivo y fechas' })
    .getByRole('combobox', { name: 'Tipo de cultivo' })
    .click();
  await page.getByRole('option', { name: 'Arroz' }).click();
  await expect(description).toBeVisible();
  await expect(page.getByText('Cultivo: soja')).toHaveCount(0);

  // On one parcel the summary starts over and is asked about that parcel alone.
  await openSection(page, 'Área de interés');
  const parcel = page
    .getByRole('region', { name: 'Área de interés' })
    .getByRole('combobox', { name: 'Parcela' });
  await parcel.click();
  await page.getByRole('option', { name: 'Parcela 2' }).click();
  await expect(description).toBeVisible();
  await page.getByRole('button', { name: 'Generar resumen' }).click();
  await expect(page.getByRole('heading', { name: 'Resumen de 1 parcelas' })).toBeVisible();
  await expect(page.getByText('Cultivo: arroz')).toBeVisible();

  // Todos: one summary per crop, soy then rice, each under its crop's title.
  await openSection(page, 'Cultivo y fechas');
  await page
    .getByRole('region', { name: 'Cultivo y fechas' })
    .getByRole('combobox', { name: 'Tipo de cultivo' })
    .click();
  await page.getByRole('option', { name: 'Todos' }).click();
  await expect(description).toBeVisible();
  await page.getByRole('button', { name: 'Generar resumen' }).click();
  await expect(page.getByRole('heading', { name: 'Resumen de 1 parcelas' })).toHaveCount(2);
  await expect(page.getByText(/^Cultivo: (soja|arroz)$/)).toHaveText([
    'Cultivo: soja',
    'Cultivo: arroz',
  ]);
});

test('Restablecer contraseña leaves the login modal for its page, and Iniciar sesión brings the modal back', async ({
  page,
}) => {
  await analyseOnRedesign(page, '/analisis/productivo');
  const login = page.getByRole('dialog', { name: 'Iniciar sesión' });

  await login.getByRole('button', { name: 'Restablecer contraseña' }).click();
  await expect(page).toHaveURL(/\/restablecer-contrasena\/?$/);
  await expect(login).toBeHidden();

  // The request heads the settings column, as the reset link's cards do.
  const settings = page.getByRole('complementary', { name: 'Configuración' });
  await expect(settings.getByRole('heading', { name: 'Restablecer contraseña' })).toBeVisible();

  // Solicitar hands off to the mail client and confirms with the email.
  await settings.getByLabel('Email').fill('ana@example.org');
  await settings.getByRole('button', { name: 'Solicitar' }).click();
  await expect(settings.getByRole('heading', { name: 'Solicitud enviada' })).toBeVisible();

  // Iniciar sesión opens the modal over the page; Escape closes it, the header reopens it.
  await settings.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(login.getByRole('button', { name: 'Acceder' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(login).toBeHidden();
  await page.getByRole('banner').getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(login).toBeVisible();
});

test('Exportar informe lays the report out in one column, every chart inside its widget', async ({
  page,
}) => {
  // The dialog itself is the browser's: the report is checked in the paper layout before it.
  await page.addInitScript(() => {
    window.print = () => {};
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await analyseOnRedesign(page, '/analisis/productivo');
  await loginAtGate(page);

  const main = page.getByRole('main');
  await main.getByRole('button', { name: 'Exportar informe' }).first().click();
  await expect(page.locator('html.paper-layout')).toHaveCount(1);

  // The settings stack above the content, which takes the paper's width (200mm).
  const settings = page.getByRole('complementary', { name: 'Configuración' });
  await expect.poll(async () => (await main.boundingBox())!.width).toBeGreaterThan(700);
  expect((await settings.boundingBox())!.y).toBeLessThan((await main.boundingBox())!.y);

  // Each chart's drawing, axis included, stays within its widget.
  const projection = widget(
    page,
    'Producción proyectada a escenario pesimista, neutro y optimista',
  );
  for (const card of [projection, widget(page, 'Producción base histórica de soja')]) {
    const cardBox = (await card.boundingBox())!;
    const chartBox = (await card.locator('svg[data-slot="chart"]').boundingBox())!;
    expect(chartBox.y + chartBox.height).toBeLessThanOrEqual(cardBox.y + cardBox.height);
  }

  // On paper the settings give way to Parámetros del análisis: the área's map as an image
  // beside the filters in force and the hectares analysed.
  const area = settings.getByRole('region', { name: 'Área de interés' });
  await page.emulateMedia({ media: 'print' });
  await expect(area).toBeHidden();
  const parameters = main.getByRole('region', { name: 'Parámetros del análisis' });
  await expect(parameters.getByRole('heading', { name: 'Parámetros del análisis' })).toBeVisible();
  await expect(parameters.getByRole('term').last()).toHaveText('Hectáreas');
  await expect(parameters.getByRole('definition').last()).toHaveText(/^[\d.,]+ ha$/);

  // The snapshot is taken at twice its printed density, so it stays sharp.
  const snapshot = parameters.locator('img[src^="data:image/png"]');
  await expect(snapshot).toBeVisible();
  const printed = (await snapshot.boundingBox())!;
  const pixels = await snapshot.evaluate((img: HTMLImageElement) => img.naturalWidth);
  expect(pixels).toBeGreaterThanOrEqual(2 * Math.floor(printed.width));

  // The historic analysis opens a page of its own.
  await expect(main.getByRole('region', { name: 'Análisis histórico de productividad' })).toHaveCSS(
    'break-before',
    'page',
  );

  // No summary generated: the AI card stays out of the report.
  await expect(main.getByRole('heading', { name: 'Resumen del análisis' })).toBeHidden();
});

test('the first analysis waits in a frame that ends inside the window, under the actions', async ({
  page,
}) => {
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => (release = resolve));
  await analyseOnRedesign(page, '/analisis/productivo', (target) =>
    target.route(
      (url) => url.pathname === '/api/parcels/analysis/production/',
      async (route) => {
        await held;
        await route.fallback();
      },
    ),
  );
  await loginAtGate(page);

  // The actions and the AI summary sit above it: the frame takes only what is left,
  // its bottom on the content column's 40px padding, never past the fold.
  const status = page.getByRole('status').filter({ hasText: 'Analizando…' });
  await expect(status).toBeVisible();
  const viewport = page.viewportSize()!;
  const box = (await status.boundingBox())!;
  expect(Math.abs(box.y + box.height - (viewport.height - 40))).toBeLessThan(2);

  release();
  await expect(status).toHaveCount(0);
});
