import { describe, expect, it } from 'vitest';

import { type AnalysisResponse, mergeAnalysisResponses } from '@/lib/api/analysis/schemas';

const answer = (indicators: AnalysisResponse['indicators']): AnalysisResponse => ({
  status: 'success',
  message: '',
  indicators,
});

describe('mergeAnalysisResponses', () => {
  it("joins each parcel's columns across the per-crop answers, first-seen order", () => {
    const rice = answer([
      { parcel_id: 'A', properties: { piricularia: 2, area: 10 } },
      { parcel_id: 'B', properties: { piricularia: 1 }, lists: { x: ['a'] } },
    ]);
    const soy = answer([
      { parcel_id: 'C', properties: { roya_asiatica: 3 } },
      { parcel_id: 'A', properties: { roya_asiatica: 1, area: 10 }, unreadable: ['y'] },
    ]);

    expect(mergeAnalysisResponses([rice, soy]).indicators).toEqual([
      {
        parcel_id: 'A',
        properties: { piricularia: 2, area: 10, roya_asiatica: 1 },
        unreadable: ['y'],
      },
      { parcel_id: 'B', properties: { piricularia: 1 }, lists: { x: ['a'] } },
      { parcel_id: 'C', properties: { roya_asiatica: 3 } },
    ]);
  });

  it('is the one answer itself when there is only one', () => {
    const only = answer([{ parcel_id: 'A', properties: { iep: 1 } }]);

    expect(mergeAnalysisResponses([only])).toBe(only);
  });
});
