/**
 * Sent with every response of the built server (`routeRules` in vite.config.ts). No
 * framing (clickjacking on the login and /usuarios), no MIME sniffing, no full URL in the
 * Referer to other sites (the reset token is in a path), no camera, microphone or
 * location. A full CSP is not here yet: hydration scripts, MapLibre's worker and a
 * configurable basemap host need a policy of their own.
 *
 * Imported by vite.config.ts, so no `@/` imports here.
 */
export const SECURITY_HEADERS = {
  'content-security-policy': "frame-ancestors 'none'",
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
} as const;
