import { describe, expect, it } from 'vitest';

import {
  type AttributionPart,
  reportAttribution,
  reportDate,
  reportFileName,
} from '@/lib/analysis/report';

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

describe('reportAttribution', () => {
  const day = new Date(2026, 10, 19);
  const text = (parts: AttributionPart[]) => parts.map((part) => part.text).join('');
  const values = (parts: AttributionPart[]) =>
    parts.filter((part) => part.value).map((part) => part.text);

  it('names the platform, the analysis identifier and the day, in Spanish', () => {
    const parts = reportAttribution('123456ABC', day);
    expect(text(parts)).toBe(
      'Resultados generados mediante la plataforma AGORA para el análisis con identificación 123456ABC, el 19 de noviembre de 2026.',
    );
    // The filled-in values, which the footer sets in italics.
    expect(values(parts)).toEqual(['123456ABC', '19 de noviembre de 2026']);
  });

  it('leaves the identifier clause out when there is none', () => {
    const parts = reportAttribution('  ', day);
    expect(text(parts)).toBe(
      'Resultados generados mediante la plataforma AGORA para este análisis, el 19 de noviembre de 2026.',
    );
    expect(values(parts)).toEqual(['19 de noviembre de 2026']);
  });
});
