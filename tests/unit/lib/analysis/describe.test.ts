import { describe, expect, it } from 'vitest';

import { describeWithFilters } from '@/lib/analysis/describe';
import type { Filters } from '@/lib/api/metadata/schemas';
import { correctApiDescription } from '@/lib/api/text-corrections';

const filters: Filters = [
  {
    id: 'crop_type',
    name: 'Tipo de cultivo',
    field_type: {
      type: 'category',
      options: [
        { value: 'rice', label: 'Arroz' },
        { value: 'soja', label: 'Soja' },
      ],
    },
  },
  { id: 'date', name: 'Fecha', field_type: { type: 'date' } },
  { id: 'sowing_date', name: 'Fecha de siembra', field_type: { type: 'date' } },
];

describe('describeWithFilters', () => {
  it('replaces a filter reference with the picked value: dates as dd/mm/yyyy, categories by label', () => {
    const text =
      "Datos observados en las 72 horas previas a {'id': 'date'} para {'id': 'crop_type'}, sembrado el {'id': 'sowing_date'}.";

    expect(
      describeWithFilters(text, filters, {
        date: '2026-09-17',
        crop_type: 'soja',
        sowing_date: '2026-05-01',
      }),
    ).toBe(
      'Datos observados en las 72 horas previas a 17/09/2026 para Soja, sembrado el 01/05/2026.',
    );
  });

  it('falls back to the filter name without a value, and to the id for an unknown filter', () => {
    expect(describeWithFilters("Previas a {'id': 'date'} y {'id': 'harvest'}.", filters, {})).toBe(
      'Previas a Fecha y harvest.',
    );
  });

  it('names the request filter group "los filtros"', () => {
    expect(
      describeWithFilters(
        "Previas a {'id': 'date'} proporcionada en disease_filters; production_filters idem.",
        filters,
        { date: '2026-09-17' },
      ),
    ).toBe('Previas a 17/09/2026 proporcionada en los filtros; los filtros idem.');
  });

  it('shows the picked date in the corrected weather station description', () => {
    const station = correctApiDescription(
      "Estación meteorológica usada para analizar los datos observados en las últimas 72 horas previas a {'id': 'date'} proporcionada en disease_filters",
    );

    expect(describeWithFilters(station, filters, { date: '2026-11-17' })).toBe(
      'Estación meteorológica usada para analizar los datos observados durante las 72 horas previas al 17/11/2026, fecha indicada en los filtros.',
    );
  });

  it('accepts typographic quotes', () => {
    expect(describeWithFilters('Hasta {‘id’: ‘date’}.', filters, { date: '2026-01-02' })).toBe(
      'Hasta 02/01/2026.',
    );
  });

  it('accepts double quotes and spacing, and leaves plain text alone', () => {
    expect(describeWithFilters('Hasta { "id" : "date" }.', filters, { date: '2026-01-02' })).toBe(
      'Hasta 02/01/2026.',
    );
    expect(describeWithFilters('Sin referencias.', filters, { date: '2026-01-02' })).toBe(
      'Sin referencias.',
    );
  });
});
