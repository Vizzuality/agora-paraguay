import { describe, expect, it } from 'vitest';

import { describeWithFilters } from '@/lib/analysis/describe';
import type { Filters } from '@/lib/api/metadata/schemas';

const filters: Filters = [
  {
    id: 'crop_type',
    name: 'Tipo de cultivo',
    field_type: {
      type: 'category',
      options: [
        { value: 'rice', label: 'Arroz' },
        { value: 'soy', label: 'Soja' },
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
        crop_type: 'soy',
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

  it('accepts double quotes and spacing, and leaves plain text alone', () => {
    expect(describeWithFilters('Hasta { "id" : "date" }.', filters, { date: '2026-01-02' })).toBe(
      'Hasta 02/01/2026.',
    );
    expect(describeWithFilters('Sin referencias.', filters, { date: '2026-01-02' })).toBe(
      'Sin referencias.',
    );
  });
});
