import { describe, expect, it } from 'vitest';

import {
  EMPTY_ANALYSIS_FILTERS,
  optionsFor,
  optionValues,
  resolveAnalysisFilters,
} from '@/lib/analysis/filters';
import type { AnalysisOptions } from '@/lib/api/schemas';

export const OPTIONS: AnalysisOptions = {
  fechasSiembra: [
    { value: '2026-05-18', label: '18/05/2026' },
    { value: '2026-06-18', label: '18/06/2026' },
  ],
  fechasAnalisis: [
    { value: '2026-07-18', label: '18/07/2026' },
    { value: '2026-08-18', label: '18/08/2026' },
  ],
  cultivos: [
    { value: 'soja', label: 'Soja' },
    { value: 'maiz', label: 'Maíz' },
  ],
  ciclos: [{ value: 'zafra', label: 'Zafra' }],
  periodo: [
    { value: '2015-01-01', label: '01/01/2015' },
    { value: '2020-01-01', label: '01/01/2020' },
    { value: '2026-07-01', label: '01/07/2026' },
  ],
};

describe('optionsFor', () => {
  it('maps each filter to its option list', () => {
    expect(optionsFor('fechaSiembra', OPTIONS)).toBe(OPTIONS.fechasSiembra);
    expect(optionsFor('fechaAnalisis', OPTIONS)).toBe(OPTIONS.fechasAnalisis);
    expect(optionsFor('cultivo', OPTIONS)).toBe(OPTIONS.cultivos);
    expect(optionsFor('ciclo', OPTIONS)).toBe(OPTIONS.ciclos);
  });

  it('feeds both period bounds from the same list', () => {
    expect(optionsFor('fechaInicio', OPTIONS)).toBe(OPTIONS.periodo);
    expect(optionsFor('fechaFin', OPTIONS)).toBe(OPTIONS.periodo);
  });
});

describe('optionValues', () => {
  it('returns values, not labels, in option order', () => {
    expect(optionValues('cultivo', OPTIONS)).toEqual(['soja', 'maiz']);
    expect(optionValues('fechaSiembra', OPTIONS)).toEqual(['2026-05-18', '2026-06-18']);
  });
});

describe('resolveAnalysisFilters', () => {
  it('defaults every filter to its first option, and the period end to the last', () => {
    expect(resolveAnalysisFilters(EMPTY_ANALYSIS_FILTERS, OPTIONS)).toEqual({
      fechaSiembra: '2026-05-18',
      fechaAnalisis: '2026-07-18',
      cultivo: 'soja',
      ciclo: 'zafra',
      fechaInicio: '2015-01-01',
      fechaFin: '2026-07-01',
    });
  });

  it('keeps a pick that the options still offer', () => {
    const resolved = resolveAnalysisFilters(
      { ...EMPTY_ANALYSIS_FILTERS, cultivo: 'maiz', fechaFin: '2020-01-01' },
      OPTIONS,
    );

    expect(resolved.cultivo).toBe('maiz');
    expect(resolved.fechaFin).toBe('2020-01-01');
  });

  it('falls back when a pick is no longer among the options', () => {
    const resolved = resolveAnalysisFilters(
      { ...EMPTY_ANALYSIS_FILTERS, cultivo: 'girasol', fechaSiembra: '1999-01-01' },
      OPTIONS,
    );

    expect(resolved.cultivo).toBe('soja');
    expect(resolved.fechaSiembra).toBe('2026-05-18');
  });

  it('clamps the period end up to the start when the start overtakes it', () => {
    const resolved = resolveAnalysisFilters(
      { ...EMPTY_ANALYSIS_FILTERS, fechaInicio: '2026-07-01', fechaFin: '2020-01-01' },
      OPTIONS,
    );

    expect(resolved).toMatchObject({ fechaInicio: '2026-07-01', fechaFin: '2026-07-01' });
  });
});
