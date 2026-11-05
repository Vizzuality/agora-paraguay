import { describe, expect, it } from 'vitest';

import { BASEMAP_TILE_ORIGIN, buildCsp, createNonce } from '@/lib/csp';

function directives(csp: string): Map<string, string[]> {
  return new Map(
    csp.split('; ').map((part) => {
      const [name, ...sources] = part.split(' ');

      return [name, sources];
    }),
  );
}

describe('buildCsp', () => {
  it('runs scripts only with the nonce, trusting what they import', () => {
    const csp = directives(buildCsp({ nonce: 'abc123' }));

    expect(csp.get('script-src')).toEqual(["'self'", "'nonce-abc123'", "'strict-dynamic'"]);
    expect(csp.get('script-src')).not.toContain("'unsafe-inline'");
    expect(csp.get('object-src')).toEqual(["'none'"]);
    expect(csp.get('frame-ancestors')).toEqual(["'none'"]);
  });

  it('allows the satellite tiles for images and fetches', () => {
    const csp = directives(buildCsp({ nonce: 'n' }));

    expect(csp.get('img-src')).toContain(BASEMAP_TILE_ORIGIN);
    expect(csp.get('connect-src')).toContain(BASEMAP_TILE_ORIGIN);
  });

  it('adds the origins of a cross-origin API and a basemap style override', () => {
    const csp = directives(
      buildCsp({
        nonce: 'n',
        apiUrl: 'https://api.example.org/v1',
        basemapStyleUrl: 'https://tiles.example.org/style.json',
      }),
    );

    expect(csp.get('connect-src')).toEqual([
      "'self'",
      'https://api.example.org',
      BASEMAP_TILE_ORIGIN,
      'https://tiles.example.org',
    ]);
    expect(csp.get('img-src')).toContain('https://tiles.example.org');
  });

  it('lists a host once even when two settings share it', () => {
    const csp = directives(
      buildCsp({ nonce: 'n', basemapStyleUrl: `${BASEMAP_TILE_ORIGIN}/style.json` }),
    );

    expect(csp.get('img-src')?.filter((source) => source === BASEMAP_TILE_ORIGIN)).toHaveLength(1);
  });
});

describe('createNonce', () => {
  it('returns 16 random bytes as base64, different each call', () => {
    const nonce = createNonce();

    expect(atob(nonce)).toHaveLength(16);
    expect(createNonce()).not.toBe(nonce);
  });
});
