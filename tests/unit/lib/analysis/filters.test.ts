import { describe, expect, it } from 'vitest';

import {
  EMPTY_ANALYSIS_FILTERS,
  listNames,
  resolveFilterSelection,
  unresolvedFilters,
} from '@/lib/analysis/filters';
import type { Filters } from '@/lib/api/metadata/schemas';

/** The live `GET /api/parcels/filters/` shapes: a category and two dates, one defaulted. */
const FILTERS: Filters = [
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
  { id: 'sowing_date', name: 'Fecha de siembra', field_type: { type: 'date', default: null } },
  { id: 'date', name: 'Fecha', field_type: { type: 'date', default: '2026-09-17' } },
];

describe('resolveFilterSelection', () => {
  it('defaults a category to its first option and a date to the API default', () => {
    expect(resolveFilterSelection(EMPTY_ANALYSIS_FILTERS, FILTERS)).toEqual({
      crop_type: 'rice',
      date: '2026-09-17',
    });
  });

  it('keeps a category pick the options still offer, and a typed date', () => {
    expect(
      resolveFilterSelection({ crop_type: 'soy', sowing_date: '2026-05-01' }, FILTERS),
    ).toEqual({ crop_type: 'soy', sowing_date: '2026-05-01', date: '2026-09-17' });
  });

  it('falls back when a category pick is no longer among the options', () => {
    expect(resolveFilterSelection({ crop_type: 'wheat' }, FILTERS).crop_type).toBe('rice');
  });

  it('ignores picks for filters the API no longer lists', () => {
    expect(resolveFilterSelection({ cultivo: 'soja' }, FILTERS)).not.toHaveProperty('cultivo');
  });

  it('leaves out a category with no options and a date without default or pick', () => {
    const filters: Filters = [
      { id: 'empty', name: 'Vacío', field_type: { type: 'category', options: [] } },
      { id: 'when', name: 'Cuándo', field_type: { type: 'date' } },
    ];

    expect(resolveFilterSelection(EMPTY_ANALYSIS_FILTERS, filters)).toEqual({});
  });

  it('drops a date the user cleared back to empty', () => {
    expect(resolveFilterSelection({ date: '' }, FILTERS)).not.toHaveProperty('date');
  });

  it('gives an empty response an empty selection', () => {
    expect(resolveFilterSelection({ crop_type: 'soy' }, [])).toEqual({});
  });
});

describe('unresolvedFilters', () => {
  it('names the filters the resolution left out — the sowing date until it is typed', () => {
    const resolved = resolveFilterSelection(EMPTY_ANALYSIS_FILTERS, FILTERS);

    expect(unresolvedFilters(resolved, FILTERS).map((filter) => filter.id)).toEqual([
      'sowing_date',
    ]);
  });

  it('is empty once every filter has a value', () => {
    const resolved = resolveFilterSelection({ sowing_date: '2026-05-01' }, FILTERS);

    expect(unresolvedFilters(resolved, FILTERS)).toEqual([]);
  });
});

describe('listNames', () => {
  it('joins names as Spanish prose', () => {
    expect(listNames(['Fecha de siembra'])).toBe('Fecha de siembra');
    expect(listNames(['Fecha de siembra', 'Fecha'])).toBe('Fecha de siembra y Fecha');
    expect(listNames(['A', 'B', 'C'])).toBe('A, B y C');
  });
});
