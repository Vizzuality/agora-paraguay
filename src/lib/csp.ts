/** Host of the built-in satellite basemap tiles (`src/lib/map/basemap.ts`). */
export const BASEMAP_TILE_ORIGIN = 'https://server.arcgisonline.com';

export type CspOptions = {
  nonce: string;
  /** `VITE_API_URL`, when the browser calls the API cross-origin. */
  apiUrl?: string;
  /** `VITE_BASEMAP_STYLE_URL`; only its origin is allowed, not hosts the style references. */
  basemapStyleUrl?: string;
};

/** A fresh nonce per response: 16 random bytes, base64. */
export function createNonce(): string {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
}

function originOf(url: string | undefined): string[] {
  return url ? [new URL(url).origin] : [];
}

/**
 * Scripts run only with the nonce (`'strict-dynamic'` extends trust to the chunks they
 * import). Styles allow inline: SSR renders `style` attributes, which a nonce cannot cover.
 */
export function buildCsp({ nonce, apiUrl, basemapStyleUrl }: CspOptions): string {
  const mapHosts = [BASEMAP_TILE_ORIGIN, ...originOf(basemapStyleUrl)];

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', ...mapHosts],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", ...originOf(apiUrl), ...mapHosts],
    'worker-src': ["'self'", 'blob:'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };

  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${[...new Set(sources)].join(' ')}`)
    .join('; ');
}
