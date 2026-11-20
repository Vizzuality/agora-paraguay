import { describe, expect, it } from 'vitest';

import { analysisTypeSummary } from '@/lib/analysis-type-summary';

describe('analysisTypeSummary', () => {
  it('shows the type alone until an identifier is given', () => {
    expect(analysisTypeSummary('', 'Exposición climática')).toBe('Exposición climática');
  });

  it('puts the identifier before the type', () => {
    expect(analysisTypeSummary('123456ABC', 'Exposición climática')).toBe(
      '123456ABC - Exposición climática',
    );
  });

  it('ignores an identifier of blanks', () => {
    expect(analysisTypeSummary('   ', 'Riesgo sanitario')).toBe('Riesgo sanitario');
  });

  it('trims the identifier', () => {
    expect(analysisTypeSummary(' P-7 ', 'Riesgo sanitario')).toBe('P-7 - Riesgo sanitario');
  });

  it('shows nothing off the analysis pages without an identifier', () => {
    expect(analysisTypeSummary('', undefined)).toBeUndefined();
  });
});
