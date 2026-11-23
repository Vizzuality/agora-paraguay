import { describe, expect, it } from 'vitest';

import { hasColumn, isUnreadable, numberOf, readingOf } from '@/lib/analysis/readings';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';

function parcel(properties: AnalysisParcel['properties'], unreadable?: string[]): AnalysisParcel {
  return { parcel_id: 'A', properties, ...(unreadable && { unreadable }) };
}

describe('readingOf', () => {
  it('matches the column ignoring case, as the backend capitalises it', () => {
    const answer = parcel({ Asian_rust: 'Alta', IEP: 42 });

    expect(readingOf(answer, 'asian_rust')).toBe('Alta');
    expect(readingOf(answer, 'iep')).toBe(42);
    expect(readingOf(answer, 'missing')).toBeUndefined();
  });

  it('prefers the exact spelling, then the first one when two differ only in case', () => {
    expect(readingOf(parcel({ iep: 1, IEP: 2 }), 'IEP')).toBe(2);
    expect(readingOf(parcel({ Iep: 1, IEP: 2 }), 'iep')).toBe(1);
  });

  it('has no reading for an NA, whatever its spelling', () => {
    expect(readingOf(parcel({ IEP: 'NA' }), 'iep')).toBeUndefined();
    expect(readingOf(parcel({ IEP: null }), 'iep')).toBeUndefined();
  });
});

describe('numberOf', () => {
  it('reads digits in a string as the number, anything else as none', () => {
    expect(numberOf(parcel({ Pro: '3.5' }), 'pro')).toBe(3.5);
    expect(numberOf(parcel({ Pro: 'Alta' }), 'pro')).toBeUndefined();
  });
});

describe('hasColumn', () => {
  it('counts a column carried in any case, NA and unreadable ones included', () => {
    expect(hasColumn(parcel({ IEP: 'NA' }), 'iep')).toBe(true);
    expect(hasColumn(parcel({}, ['Fechas']), 'fechas')).toBe(true);
    expect(hasColumn(parcel({ IEP: 1 }), 'other')).toBe(false);
  });

  it('tells an unreadable column apart, ignoring case', () => {
    expect(isUnreadable(parcel({}, ['Fechas']), 'FECHAS')).toBe(true);
    expect(isUnreadable(parcel({ Fechas: 1 }), 'fechas')).toBe(false);
  });
});
