/**
 * Shared vocabulary of the upload pipeline: the parsers in this module all converge on
 * `ParseOutcome`, and everything user-facing (warnings, errors, the result banner) is
 * typed here so the UI never has to interpret parser internals.
 *
 * GeoJSON types are declared locally rather than via `@types/geojson`, matching the
 * stance in `draw-features.ts`: `geojson` is only a transitive dependency.
 */

/** Uploads are parsed on the main thread, so the cap keeps the jank bounded. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** A position after normalisation: z/m dropped, precision capped at 9 decimals. */
export type LngLat = [number, number];

export type UploadPolygonGeometry = {
  type: "Polygon";
  coordinates: LngLat[][];
};

/**
 * A polygon ready for `TerraDraw.addFeatures`. `mode` is what the store requires,
 * `origin` is what the replace-on-upload semantics key on, and `name` rides the
 * snapshot pipeline so no side table has to map ids to display names.
 */
export type UploadFeature = {
  id: string;
  type: "Feature";
  geometry: UploadPolygonGeometry;
  properties: {
    mode: "polygon";
    origin: "upload";
    name: string;
  };
};

export type UploadWarning = {
  /** The polygon the warning is about, when it is about a single one. */
  featureName?: string;
  message: string;
};

/** What every parser returns: polygons fit for the store, plus what got left behind. */
export type ParseOutcome = {
  features: UploadFeature[];
  warnings: UploadWarning[];
};

export type UploadErrorCode =
  | "unsupported-type"
  | "too-large"
  | "unreadable"
  | "bad-crs"
  | "no-polygons"
  | "empty";

/** A failed upload. The message is user-facing; the code is for tests and branching. */
export class UploadError extends Error {
  readonly code: UploadErrorCode;

  constructor(code: UploadErrorCode, message: string) {
    super(message);
    this.name = "UploadError";
    this.code = code;
  }
}

/** The outcome of the most recent upload, for the live region and the warning list. */
export type UploadResult = {
  fileName: string;
  /** Polygons that made it into the store. Zero whenever `error` is set. */
  accepted: number;
  warnings: UploadWarning[];
  error: string | null;
};
