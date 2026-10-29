import type { Page } from '@playwright/test';

/** Paso 1 of the selection: picks a riesgo so the panel moves on to the área de interés. */
export async function pickAnalysisType(
  page: Page,
  label: 'Riesgo sanitario' | 'Riesgo productivo' = 'Riesgo sanitario',
) {
  await page.getByRole('button', { name: label }).click();
}
