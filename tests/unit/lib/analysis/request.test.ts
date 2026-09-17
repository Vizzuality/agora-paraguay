import { describe, expect, it } from 'vitest';

import type { ResolvedAnalysisFilters } from '@/lib/analysis/filters';
import {
  defaultIndicatorIds,
  riesgoOf,
  toAnalysisRequest,
  visibilityOf,
} from '@/lib/analysis/request';
import type { Indicator } from '@/lib/api/metadata/schemas';

const FILTERS: ResolvedAnalysisFilters = {
  fechaSiembra: '2026-06-18',
  fechaAnalisis: '2026-08-18',
  cultivo: 'soja',
  ciclo: 'zafra',
  fechaInicio: '2010-01-01',
  fechaFin: '2025-12-31',
};

function indicator(id: string, isDefault?: boolean): Indicator {
  return { id, name: id, ...(isDefault === undefined ? {} : { default: isDefault }) };
}

describe('riesgoOf', () => {
  it('maps public to sanitario and private to productivo', () => {
    expect(riesgoOf('public')).toBe('sanitario');
    expect(riesgoOf('private')).toBe('productivo');
  });

  it('round-trips through visibilityOf', () => {
    expect(visibilityOf('sanitario')).toBe('public');
    expect(visibilityOf('productivo')).toBe('private');
    expect(visibilityOf(riesgoOf('private'))).toBe('private');
  });
});

describe('defaultIndicatorIds', () => {
  it('keeps the indicators flagged default', () => {
    expect(
      defaultIndicatorIds([indicator('iep', true), indicator('rend', false), indicator('x')]),
    ).toEqual(['iep']);
  });

  it('falls back to every indicator when none is flagged', () => {
    expect(defaultIndicatorIds([indicator('a'), indicator('b', false)])).toEqual(['a', 'b']);
  });
});

describe('toAnalysisRequest', () => {
  it('maps the four sanitario dropdowns for a public request', () => {
    expect(toAnalysisRequest('public', [1, 2], FILTERS, ['iep'])).toEqual({
      parcel_ids: [1, 2],
      filters: {
        crop: 'soja',
        cycle: 'zafra',
        start_date: '2026-06-18',
        end_date: '2026-08-18',
        indicators: ['iep'],
      },
    });
  });

  it('maps the period only for a private request', () => {
    expect(toAnalysisRequest('private', [1], FILTERS, ['rendimiento'])).toEqual({
      parcel_ids: [1],
      filters: { start_date: '2010-01-01', end_date: '2025-12-31', indicators: ['rendimiento'] },
    });
  });
});
