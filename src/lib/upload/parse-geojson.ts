import { normalizeUnknown } from "@/lib/upload/normalize";
import { UploadError, type ParseOutcome } from "@/lib/upload/types";

/**
 * GeoJSON needs no parsing library: `JSON.parse` plus the Zod schema inside
 * `normalizeUnknown` is the whole format. Pure — it takes the file's text, not the
 * file — so it is unit-tested in node alongside `normalize.ts`.
 */
export function parseGeoJson(text: string): ParseOutcome {
  let raw: unknown;

  try {
    raw = JSON.parse(text);
  } catch {
    throw new UploadError("unreadable", "The file could not be read as GeoJSON.");
  }

  return normalizeUnknown(raw, "GeoJSON");
}
