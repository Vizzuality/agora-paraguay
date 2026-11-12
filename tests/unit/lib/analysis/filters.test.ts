import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  dateBounds,
  dayBefore,
  DEFAULT_SOWING_DATE,
  EMPTY_ANALYSIS_FILTERS,
  heroFieldSpansRow,
  isoToDate,
  orderHeroFilters,
  MIN_ANALYSIS_DATE,
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
  // Today is 2026-11-12, so the date defaults to 2026-11-11.
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 12, 12));
  });
  afterEach(() => vi.useRealTimers());

  it('defaults the crop to soy, the sowing date to 1 October and the date to yesterday', () => {
    expect(resolveFilterSelection(EMPTY_ANALYSIS_FILTERS, FILTERS)).toEqual({
      crop_type: 'soja',
      sowing_date: DEFAULT_SOWING_DATE,
      date: '2026-11-11',
    });
  });

  it("ignores the API's defaults for the sowing date and the date", () => {
    const filters: Filters = [
      {
        id: 'sowing_date',
        name: 'Fecha de siembra',
        field_type: { type: 'date', default: '2026-06-18' },
      },
      { id: 'date', name: 'Fecha', field_type: { type: 'date', default: '2026-09-17' } },
    ];

    expect(resolveFilterSelection(EMPTY_ANALYSIS_FILTERS, filters)).toEqual({
      sowing_date: DEFAULT_SOWING_DATE,
      date: '2026-11-11',
    });
  });

  it('keeps the API default, else today, for any other date', () => {
    const filters: Filters = [
      { id: 'when', name: 'Cuándo', field_type: { type: 'date', default: '2026-05-01' } },
      { id: 'until', name: 'Hasta', field_type: { type: 'date' } },
    ];

    expect(resolveFilterSelection(EMPTY_ANALYSIS_FILTERS, filters)).toEqual({
      when: '2026-05-01',
      until: '2026-11-12',
    });
  });

  it('moves a date before 1 September 2024 up to it, and one after today down to today', () => {
    expect(
      resolveFilterSelection({ sowing_date: '2024-01-15', date: '2027-01-01' }, FILTERS),
    ).toMatchObject({ sowing_date: MIN_ANALYSIS_DATE, date: '2026-11-12' });
  });

  it('moves a sowing date on or after the date to the day before', () => {
    expect(resolveFilterSelection({ date: '2026-09-17' }, FILTERS).sowing_date).toBe('2026-09-16');
    expect(
      resolveFilterSelection({ sowing_date: '2026-09-17', date: '2026-09-17' }, FILTERS)
        .sowing_date,
    ).toBe('2026-09-16');
  });

  it('keeps a typed sowing date before the date as it is', () => {
    expect(
      resolveFilterSelection({ sowing_date: '2026-05-01', date: '2026-09-17' }, FILTERS),
    ).toMatchObject({ sowing_date: '2026-05-01', date: '2026-09-17' });
  });

  it('falls back when a category pick is no longer among the options', () => {
    expect(resolveFilterSelection({ crop_type: 'wheat' }, FILTERS).crop_type).toBe('soja');
  });

  it('ignores picks for filters the API no longer lists', () => {
    expect(resolveFilterSelection({ cultivo: 'soja' }, FILTERS)).not.toHaveProperty('cultivo');
  });

  it('leaves out a category with no options', () => {
    const filters: Filters = [
      { id: 'empty', name: 'Vacío', field_type: { type: 'category', options: [] } },
    ];

    expect(resolveFilterSelection(EMPTY_ANALYSIS_FILTERS, filters)).toEqual({});
  });

  it('drops a date the user cleared back to empty', () => {
    expect(resolveFilterSelection({ date: '' }, FILTERS)).not.toHaveProperty('date');
  });

  it('gives an empty response an empty selection', () => {
    expect(resolveFilterSelection({ crop_type: 'soja' }, [])).toEqual({});
  });
});

describe('dateBounds', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 12, 12));
  });
  afterEach(() => vi.useRealTimers());

  it('offers the date from 1 September 2024 to today', () => {
    expect(dateBounds('date', { date: '2026-11-11' })).toEqual({
      min: MIN_ANALYSIS_DATE,
      max: '2026-11-12',
    });
  });

  it('offers the sowing date up to the day before the date', () => {
    expect(dateBounds('sowing_date', { date: '2026-11-11' })).toEqual({
      min: MIN_ANALYSIS_DATE,
      max: '2026-11-10',
    });
  });
});

describe('dayBefore', () => {
  it('steps back across a month and a year', () => {
    expect(dayBefore('2026-03-01')).toBe('2026-02-28');
    expect(dayBefore('2026-01-01')).toBe('2025-12-31');
  });
});

describe('isoToDate', () => {
  it('reads an ISO day as local midnight, offset by whole days', () => {
    expect(isoToDate('2024-09-01')).toEqual(new Date(2024, 8, 1));
    expect(isoToDate('2026-01-01', -1)).toEqual(new Date(2025, 11, 31));
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

  it('puts the sowing date first, the date second and the crop last, whatever the API order', () => {
    expect(orderHeroFilters([crop, date, sowing]).map((f) => f.id)).toEqual([
      'sowing_date',
      'date',
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
