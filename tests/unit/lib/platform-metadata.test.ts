import { describe, expect, it } from 'vitest';

import { ANALYSIS_TYPES } from '@/lib/nav-links';
import { analysisTypeMetadata, EXPOSURE_INTRO, PARCEL_LEGEND_NOTE } from '@/lib/platform-metadata';

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

  it("notes which season the parcel legend's crop textures read", () => {
    expect(PARCEL_LEGEND_NOTE).toBe('*Cultivos de 2025');
  });
});
