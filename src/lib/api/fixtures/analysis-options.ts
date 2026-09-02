import type { AnalysisOption, AnalysisOptions } from '../schemas';

/**
 * TODO(mock-analysis-options): stand-in for the analysis parameters endpoint. Delete
 * with the mock branch in `client.ts` (grep `mock-analysis-options`).
 *
 * Values are plausible for Paraguayan row crops — zafra / zafriña are the two soy
 * seasons — so the hero reads as real while the contract is pending.
 */

const DATE_LABEL = new Intl.DateTimeFormat('es-PY', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

/** `2026-06-18` → `{ value: '2026-06-18', label: '18/06/2026' }`, pinned to UTC so the day never shifts. */
function dateOption(iso: string): AnalysisOption {
  return { value: iso, label: DATE_LABEL.format(new Date(`${iso}T00:00:00Z`)) };
}

export const analysisOptionsFixture: AnalysisOptions = {
  fechasSiembra: ['2026-05-18', '2026-06-18', '2026-07-18'].map(dateOption),
  fechasAnalisis: ['2026-07-18', '2026-08-18', '2026-09-01'].map(dateOption),
  cultivos: [
    { value: 'soja', label: 'Soja' },
    { value: 'maiz', label: 'Maíz' },
    { value: 'trigo', label: 'Trigo' },
    { value: 'arroz', label: 'Arroz' },
  ],
  ciclos: [
    { value: 'zafra', label: 'Zafra' },
    { value: 'zafrina', label: 'Zafriña' },
  ],
  periodo: [
    '2015-01-01',
    '2017-01-01',
    '2019-01-01',
    '2021-01-01',
    '2023-01-01',
    '2025-01-01',
    '2026-07-01',
  ].map(dateOption),
};
