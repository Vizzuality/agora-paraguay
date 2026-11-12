import { describe, expect, it } from 'vitest';

import {
  dayBefore,
  EMPTY_ANALYSIS_FILTERS,
  heroFieldSpansRow,
  orderHeroFilters,
  resolveFilterSelection,
  todayIso,
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
        { value: 'soja', label: 'Soja' },
      ],
    },
  },
  { id: 'sowing_date', name: 'Fecha de siembra', field_type: { type: 'date', default: null } },
  { id: 'date', name: 'Fecha', field_type: { type: 'date', default: '2026-09-17' } },
];

describe('resolveFilterSelection', () => {
  it('defaults the crop to soy and a date to the API default', () => {
    expect(resolveFilterSelection(EMPTY_ANALYSIS_FILTERS, FILTERS)).toMatchObject({
      crop_type: 'soja',
      date: '2026-09-17',
    });
  });

  it("moves today's sowing date to the day before a default date that is earlier", () => {
    expect(resolveFilterSelection(EMPTY_ANALYSIS_FILTERS, FILTERS).sowing_date).toBe('2026-09-16');
  });

  it('moves a sowing date on the date to the day before', () => {
    const filters: Filters = [
      { id: 'sowing_date', name: 'Fecha de siembra', field_type: { type: 'date' } },
      { id: 'date', name: 'Fecha', field_type: { type: 'date' } },
    ];

    expect(resolveFilterSelection(EMPTY_ANALYSIS_FILTERS, filters)).toEqual({
      sowing_date: dayBefore(todayIso()),
      date: todayIso(),
    });
  });

  it('moves a typed sowing date after the date to the day before', () => {
    expect(resolveFilterSelection({ sowing_date: '2026-10-01' }, FILTERS).sowing_date).toBe(
      '2026-09-16',
    );
  });

  it('keeps a sowing date before the date as it is', () => {
    expect(
      resolveFilterSelection({ sowing_date: '2026-09-16', date: '2026-09-17' }, FILTERS)
        .sowing_date,
    ).toBe('2026-09-16');
  });

  it('keeps a category pick the options still offer, and a typed date', () => {
    expect(
      resolveFilterSelection({ crop_type: 'soja', sowing_date: '2026-05-01' }, FILTERS),
    ).toEqual({ crop_type: 'soja', sowing_date: '2026-05-01', date: '2026-09-17' });
  });

  it('falls back when a category pick is no longer among the options', () => {
    expect(resolveFilterSelection({ crop_type: 'wheat' }, FILTERS).crop_type).toBe('soja');
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
    expect(resolveFilterSelection({ crop_type: 'soja' }, [])).toEqual({});
  });
});

describe('dayBefore', () => {
  it('steps back across a month and a year', () => {
    expect(dayBefore('2026-03-01')).toBe('2026-02-28');
    expect(dayBefore('2026-01-01')).toBe('2025-12-31');
  });
});

describe('todayIso', () => {
  it('writes the local calendar day as the date inputs do', () => {
    expect(todayIso(new Date(2026, 8, 5, 23, 30))).toBe('2026-09-05');
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('heroFieldSpansRow', () => {
  it("gives sanitario's crop, the odd last of three, a row of its own", () => {
    expect([0, 1, 2].map((index) => heroFieldSpansRow(index, 3))).toEqual([false, false, true]);
  });

  it("pairs productivo's year and crop on one row", () => {
    expect([0, 1].map((index) => heroFieldSpansRow(index, 2))).toEqual([false, false]);
  });

  it('lets a lone field take the row', () => {
    expect(heroFieldSpansRow(0, 1)).toBe(true);
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

  it("puts productivo's year before the crop, where the date goes", () => {
    const year: Filters[number] = {
      id: 'year',
      name: 'Año',
      field_type: { type: 'category', options: [{ value: '2027', label: '2027' }] },
    };

    expect(orderHeroFilters([crop, year]).map((f) => f.id)).toEqual(['year', 'crop_type']);
    expect(resolveFilterSelection({}, [crop, year])).toEqual({ year: '2027' });
  });

  it('keeps anything else after the known filters, in the API order', () => {
    expect(orderHeroFilters([other, crop, date]).map((f) => f.id)).toEqual([
      'date',
      'crop_type',
      'cycle',
    ]);
  });
});
