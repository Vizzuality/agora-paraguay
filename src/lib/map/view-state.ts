/**
 * Map view state, kept in the URL so a view can be shared and restored.
 *
 * Values are clamped and rounded before they reach the URL: unclamped values from a
 * hand-edited link can put MapLibre into an invalid camera, and full float precision
 * makes for a long, ugly URL that changes on every pixel of movement.
 */
export const ZOOM_RANGE = { min: 0, max: 22 } as const;

/**
 * Web Mercator cannot represent the poles. The true limit is 85.0511287798…, which is
 * truncated — not rounded — to the coordinate precision below, so that clamping then
 * rounding is idempotent and can never land outside the projection's valid range.
 */
export const LATITUDE_RANGE = { min: -85.05112, max: 85.05112 } as const;

/** Metre-ish precision at these zooms, without pointless churn in the URL. */
const COORDINATE_PRECISION = 5;
const ZOOM_PRECISION = 2;

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Longitude wraps rather than clamps — crossing the antimeridian is legitimate. */
export function normalizeLongitude(longitude: number) {
  const wrapped = ((((longitude + 180) % 360) + 360) % 360) - 180;
  return round(wrapped, COORDINATE_PRECISION);
}

export function normalizeLatitude(latitude: number) {
  return round(clamp(latitude, LATITUDE_RANGE.min, LATITUDE_RANGE.max), COORDINATE_PRECISION);
}

export function normalizeZoom(zoom: number) {
  return round(clamp(zoom, ZOOM_RANGE.min, ZOOM_RANGE.max), ZOOM_PRECISION);
}

export type MapViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
};

export function normalizeViewState(viewState: MapViewState): MapViewState {
  return {
    longitude: normalizeLongitude(viewState.longitude),
    latitude: normalizeLatitude(viewState.latitude),
    zoom: normalizeZoom(viewState.zoom),
  };
}
