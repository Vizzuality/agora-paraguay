import { describe, expect, it } from 'vitest';

import { parcelLabel } from '@/lib/analysis/parcel-label';

describe('parcelLabel', () => {
  it('numbers a parcel by its position in the analysed selection, from 1', () => {
    const analysed = ['D07D21P00000002', 'D07D23P00000008'];

    expect(parcelLabel('D07D21P00000002', analysed)).toBe('Parcela 1');
    expect(parcelLabel('D07D23P00000008', analysed)).toBe('Parcela 2');
  });

  it('keeps the id for a parcel outside the selection', () => {
    expect(parcelLabel('D07D99P00000001', ['D07D21P00000002'])).toBe('D07D99P00000001');
  });
});
