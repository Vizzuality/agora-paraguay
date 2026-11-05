import { describe, expect, it } from 'vitest';

import { SECURITY_HEADERS } from '@/lib/security-headers';

describe('SECURITY_HEADERS', () => {
  it('forbids framing in both the CSP and the legacy header', () => {
    expect(SECURITY_HEADERS['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(SECURITY_HEADERS['x-frame-options']).toBe('DENY');
  });

  it('keeps paths out of cross-origin Referers and turns off MIME sniffing', () => {
    expect(SECURITY_HEADERS['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(SECURITY_HEADERS['x-content-type-options']).toBe('nosniff');
  });

  it('denies camera, microphone and location, which the app never uses', () => {
    expect(SECURITY_HEADERS['permissions-policy']).toBe('camera=(), microphone=(), geolocation=()');
  });
});
