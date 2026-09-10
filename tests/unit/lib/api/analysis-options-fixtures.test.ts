import { describe, expect, it } from 'vitest';

import { analysisOptionsFixture } from '@/lib/api/fixtures/analysis-options';
import { analysisOptionsSchema } from '@/lib/api/schemas';

const DATE_LISTS = [
  analysisOptionsFixture.fechasSiembra,
  analysisOptionsFixture.fechasAnalisis,
  analysisOptionsFixture.periodo,
];

describe('analysisOptionsFixture', () => {
  it('satisfies the analysis options schema', () => {
    expect(() => analysisOptionsSchema.parse(analysisOptionsFixture)).not.toThrow();
  });

  it('lists every date list in ascending order', () => {
    for (const dates of DATE_LISTS) {
      const values = dates.map((option) => option.value);

      expect(values).toEqual([...values].sort());
    }
  });

  it('labels dates as dd/mm/yyyy without a time-zone day shift', () => {
    for (const dates of DATE_LISTS) {
      for (const { value, label } of dates) {
        const [year, month, day] = value.split('-');

        expect(label).toBe(`${day}/${month}/${year}`);
      }
    }
  });

  it('gives every option list unique values', () => {
    for (const list of Object.values(analysisOptionsFixture)) {
      const values = list.map((option) => option.value);

      expect(new Set(values).size).toBe(values.length);
    }
  });
});
