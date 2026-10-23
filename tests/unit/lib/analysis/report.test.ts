import { describe, expect, it } from 'vitest';

import { reportCaption, reportDate, reportFileName } from '@/lib/analysis/report';

describe('reportFileName', () => {
  it('names the file after the riesgo and the local date, zero-padded', () => {
    expect(reportFileName('productivo', new Date(2026, 9, 9))).toBe('agora-productivo-2026-10-09');
    expect(reportFileName('sanitario', new Date(2026, 0, 1))).toBe('agora-sanitario-2026-01-01');
  });
});

describe('reportDate', () => {
  it('uses the local date, not UTC', () => {
    // Just before midnight local time stays on that day whatever UTC says.
    expect(reportDate(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
  });
});

describe('reportCaption', () => {
  it('reads as a Spanish long date', () => {
    expect(reportCaption(new Date(2026, 9, 9))).toBe('Informe generado el 9 de octubre de 2026');
  });
});
