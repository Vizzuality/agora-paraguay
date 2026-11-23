import { describe, expect, it } from 'vitest';

import { ANALYSIS_TYPES } from '@/lib/nav-links';
import {
  analysisTypeMetadata,
  colorTone,
  CROP_NAMES,
  EXPOSURE_INTRO,
  PARCEL_LEGEND_LABELS,
  riskColorSchema,
} from '@/lib/platform-metadata';

describe('platform metadata', () => {
  it('names, describes and gates every analysis type', () => {
    expect(analysisTypeMetadata('productivo')).toMatchObject({
      label: 'Riesgo productivo',
      requiresLogin: true,
    });
    expect(analysisTypeMetadata('sanitario').requiresLogin).toBe(false);

    for (const { label, description } of ANALYSIS_TYPES) {
      expect(label).toBeTruthy();
      expect(description).toBeTruthy();
    }
  });

  it('keeps the analysis types in display order: exposure, then the risks', () => {
    expect(ANALYSIS_TYPES.map(({ label }) => label)).toEqual([
      'Exposición climática',
      'Riesgo sanitario',
      'Riesgo productivo',
    ]);
  });

  it('explains both views of the exposure map', () => {
    expect(EXPOSURE_INTRO.readMap.body.exposicion.length).toBeGreaterThan(0);
    expect(EXPOSURE_INTRO.readMap.body.capas.length).toBeGreaterThan(0);
  });

  it('names every parcel legend row and crop the app renders', () => {
    for (const text of [...Object.values(PARCEL_LEGEND_LABELS), ...Object.values(CROP_NAMES)]) {
      expect(text).toBeTruthy();
    }
    expect(Object.keys(PARCEL_LEGEND_LABELS)).toEqual(['selection', 'soja', 'arroz']);
    expect(Object.keys(CROP_NAMES)).toEqual(['soja', 'rice']);
  });
});

describe('colorTone', () => {
  it('paints each metadata colour name with its ruler tone', () => {
    expect(riskColorSchema.options.map(colorTone)).toEqual([
      'none',
      'low',
      'medium',
      'elevated',
      'high',
    ]);
  });
});
