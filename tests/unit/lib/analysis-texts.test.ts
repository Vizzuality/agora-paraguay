import { describe, expect, it } from 'vitest';

import { ANALYSIS_TEXTS, analysisDescription, splitStrong } from '@/lib/analysis-texts';
import { ANALYSIS_TYPES } from '@/lib/nav-links';

describe('analysis texts', () => {
  it('gives every analysis type a description', () => {
    for (const { to } of ANALYSIS_TYPES) expect(analysisDescription(String(to))).toBeTruthy();
  });

  it('explains both views of the exposure map', () => {
    const { body } = ANALYSIS_TEXTS.exposureIntro.readMap;
    expect(body.exposicion.length).toBeGreaterThan(0);
    expect(body.capas.length).toBeGreaterThan(0);
  });

  it('has no description off the analysis pages', () => {
    expect(analysisDescription('/')).toBeUndefined();
  });
});

describe('splitStrong', () => {
  it('marks the runs between double asterisks as bold', () => {
    expect(splitStrong('Ambas capas a un **período de 100 años**.')).toEqual([
      { text: 'Ambas capas a un ', strong: false, offset: 0 },
      { text: 'período de 100 años', strong: true, offset: 19 },
      { text: '.', strong: false, offset: 40 },
    ]);
  });

  it('leaves plain copy as one segment', () => {
    expect(splitStrong('Sin negrita.')).toEqual([
      { text: 'Sin negrita.', strong: false, offset: 0 },
    ]);
  });

  it('drops the empty edges when bold starts or ends the paragraph', () => {
    expect(splitStrong('**Todo en negrita.**')).toEqual([
      { text: 'Todo en negrita.', strong: true, offset: 2 },
    ]);
  });
});
