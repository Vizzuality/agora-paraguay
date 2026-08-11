import { env } from "@/env";

/**
 * Basemap style.
 *
 * The client's vector tiles do not exist yet, so this defaults to a keyless public
 * style purely so there is something to develop against. It is read from an env var
 * rather than hardcoded, which makes this module the single place to change when the
 * real tile endpoint arrives — the same seam `src/lib/api/client.ts` provides for data.
 *
 * CARTO Positron is deliberately low-contrast: it is a background for data, not a
 * subject. Attribution comes from the style's own sources, which MapLibre renders.
 */
export const BASEMAP_STYLE_URL = env.VITE_BASEMAP_STYLE_URL;

/**
 * Paraguay, framed so the whole country is visible at the default viewport.
 * Bounds are approximate: roughly 54.2°W–62.7°W, 19.3°S–27.6°S.
 */
export const INITIAL_VIEW_STATE = {
  longitude: -58.44,
  latitude: -23.44,
  zoom: 5.5,
} as const;

/**
 * Keeps the camera near Paraguay without hard-locking it.
 * MapLibre expects a flat [west, south, east, north] tuple.
 */
export const MAX_BOUNDS: [number, number, number, number] = [-66, -31, -51, -15];
