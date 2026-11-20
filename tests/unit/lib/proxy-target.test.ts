import { describe, expect, it } from 'vitest';

import { proxyTarget } from '@/lib/proxy-target';

describe('proxyTarget', () => {
  it('drops a trailing slash, which would break the CSRF Origin check', () => {
    expect(proxyTarget('http://46.60.18.203:8082/')).toBe('http://46.60.18.203:8082');
  });

  it('drops repeated trailing slashes and surrounding whitespace', () => {
    expect(proxyTarget('  https://api.example.com//  ')).toBe('https://api.example.com');
  });

  it('keeps an origin without a slash as it is', () => {
    expect(proxyTarget('http://46.60.18.203:8082')).toBe('http://46.60.18.203:8082');
  });

  it('falls back to the local backend when unset or blank', () => {
    expect(proxyTarget(undefined)).toBe('http://localhost:8000');
    expect(proxyTarget('   ')).toBe('http://localhost:8000');
  });
});
