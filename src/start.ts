import { createMiddleware, createStart } from '@tanstack/react-start';

import { env } from '@/env';
import { buildCsp, createNonce } from '@/lib/csp';

/**
 * Report-Only for now: violations are logged in the browser console, nothing is
 * blocked. Built server only — Vite's dev scripts carry no nonce.
 */
const cspMiddleware = createMiddleware().server(async ({ next }) => {
  const nonce = createNonce();
  const result = await next({ context: { nonce } });

  if (!import.meta.env.DEV) {
    result.response.headers.set(
      'content-security-policy-report-only',
      buildCsp({
        nonce,
        apiUrl: env.VITE_API_URL,
        basemapStyleUrl: env.VITE_BASEMAP_STYLE_URL,
      }),
    );
  }

  return result;
});

export const startInstance = createStart(() => ({
  requestMiddleware: [cspMiddleware],
}));
