import { describe, expect, it } from 'vitest';

import { resolveActiveParcel } from '@/lib/analysis/active-parcel';

const SUBMITTED = ['D07D21P00000002', 'D07D23P00000008'];

describe('resolveActiveParcel', () => {
  it('keeps a stored parcel that is still submitted', () => {
    expect(resolveActiveParcel(SUBMITTED, 'D07D23P00000008')).toBe('D07D23P00000008');
  });

  it('falls back to Todas when the stored parcel left the selection', () => {
    expect(resolveActiveParcel(SUBMITTED, 'D07D99P00000001')).toBeNull();
    expect(resolveActiveParcel([], 'D07D21P00000002')).toBeNull();
  });

  it('is Todas when nothing is stored', () => {
    expect(resolveActiveParcel(SUBMITTED, null)).toBeNull();
  });
});
