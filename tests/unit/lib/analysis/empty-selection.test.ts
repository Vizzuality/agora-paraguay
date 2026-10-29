import { describe, expect, it } from 'vitest';

import { sendsBackToSelection } from '@/lib/analysis/empty-selection';

describe('sendsBackToSelection', () => {
  it('sends an empty riesgo page back once the saved selection is read', () => {
    expect(
      sendsBackToSelection({ pathname: '/analisis/sanitario', hydrated: true, parcelCount: 0 }),
    ).toBe(true);
    expect(
      sendsBackToSelection({ pathname: '/analisis/productivo', hydrated: true, parcelCount: 0 }),
    ).toBe(true);
  });

  it('waits for the saved selection before deciding', () => {
    expect(
      sendsBackToSelection({ pathname: '/analisis/sanitario', hydrated: false, parcelCount: 0 }),
    ).toBe(false);
  });

  it('keeps a riesgo page with parcels', () => {
    expect(
      sendsBackToSelection({ pathname: '/analisis/sanitario', hydrated: true, parcelCount: 2 }),
    ).toBe(false);
  });

  it('never sends Exposición climática back: it does not depend on the selection', () => {
    for (const pathname of ['/analisis/exposicion-climatica', '/analisis/exposicion-climatica/']) {
      expect(sendsBackToSelection({ pathname, hydrated: true, parcelCount: 0 })).toBe(false);
    }
  });
});
