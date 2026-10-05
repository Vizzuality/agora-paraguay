import { describe, expect, it } from 'vitest';

import {
  EMPTY_ANALYSIS_FILTERS,
  orderHeroFilters,
  resolveFilterSelection,
  todayIso,
} from '@/lib/analysis/filters';
import type { Filters } from '@/lib/api/metadata/schemas';

/** The live `GET /api/parcels/filters` shapes: a category and two dates, one defaulted. */
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
  it('defaults a category to its first option, a date to the API default, else to today', () => {
    expect(resolveFilterSelection(EMPTY_ANALYSIS_FILTERS, FILTERS)).toEqual({
      crop_type: 'rice',
      sowing_date: todayIso(),
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

  it('leaves out a category with no options; a date without default or pick is today', () => {
    const filters: Filters = [
      { id: 'empty', name: 'Vacío', field_type: { type: 'category', options: [] } },
      { id: 'when', name: 'Cuándo', field_type: { type: 'date' } },
    ];

    expect(resolveFilterSelection(EMPTY_ANALYSIS_FILTERS, filters)).toEqual({ when: todayIso() });
  });

  it('drops a date the user cleared back to empty', () => {
    expect(resolveFilterSelection({ date: '' }, FILTERS)).not.toHaveProperty('date');
  });

  it('gives an empty response an empty selection', () => {
    expect(resolveFilterSelection({ crop_type: 'soy' }, [])).toEqual({});
  });
});

describe('todayIso', () => {
  it('writes the local calendar day as the date inputs do', () => {
    expect(todayIso(new Date(2026, 8, 5, 23, 30))).toBe('2026-09-05');
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('orderHeroFilters', () => {
  const date: Filters[number] = { id: 'date', name: 'Fecha', field_type: { type: 'date' } };
  const sowing: Filters[number] = {
    id: 'sowing_date',
    name: 'Fecha de siembra',
    field_type: { type: 'date' },
  };
  const crop: Filters[number] = {
    id: 'crop_type',
    name: 'Tipo de cultivo',
    field_type: { type: 'category', options: [] },
  };
  const other: Filters[number] = {
    id: 'cycle',
    name: 'Ciclo',
    field_type: { type: 'category', options: [] },
  };

  it('puts the date first, the sowing date second and the crop last, whatever the API order', () => {
    expect(orderHeroFilters([crop, sowing, date]).map((f) => f.id)).toEqual([
      'date',
      'sowing_date',
      'crop_type',
    ]);
  });

  it('keeps anything else after the known three, in the API order', () => {
    expect(orderHeroFilters([other, crop, date]).map((f) => f.id)).toEqual([
      'date',
      'crop_type',
      'cycle',
    ]);
  });
});
