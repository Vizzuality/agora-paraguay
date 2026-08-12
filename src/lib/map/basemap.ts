import { env } from "@/env";

/**
 * Basemap style.
 *
 * Defaults to a keyless public style so there is something to develop against. It is
 * read from an env var rather than hardcoded, which makes this module the single place
 * to change for the client's tile endpoint — the same seam `src/lib/api/client.ts`
 * provides for data.
 *
 * CARTO Positron is deliberately low-contrast: it is a background for data, not a
 * subject. Attribution comes from the style's own sources, which MapLibre renders.
 */
export const BASEMAP_STYLE_URL = env.VITE_BASEMAP_STYLE_URL;

/**
 * Centred on Paraguay (extent ≈ 62.6°W–54.3°W, 27.6°S–19.3°S) at a zoom that fits
 * the whole country in the default viewport.
 */
export const INITIAL_VIEW_STATE = {
  longitude: -58.44,
  latitude: -23.44,
  zoom: 5.5,
} as const;

/**
 * Camera limit — Paraguay's extent padded by roughly 4° so neighbouring context stays
 * reachable, without letting the map wander off to another continent. Intentionally
 * wider than the extent quoted above.
 *
 * MapLibre expects a flat [west, south, east, north] tuple.
 */
export const MAX_BOUNDS: [number, number, number, number] = [-66, -31, -51, -15];
