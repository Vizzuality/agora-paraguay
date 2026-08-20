import { normalizeUnknown } from "@/lib/upload/normalize";
import { UploadError, type ParseOutcome, type UploadWarning } from "@/lib/upload/types";

/**
 * Zipped shapefiles, via `shpjs`: the one library where "a shapefile in EPSG:32721
 * (UTM 21S — the likely projection for Paraguay) becomes WGS84 polygons" is a single
 * call, because it bundles the zip handling and proj4 reprojection.
 *
 * The zip's file listing is inspected with fflate first, because shpjs's result cannot
 * say what was missing: no `.shp` is a hard error, while missing `.dbf` (names) and
 * missing `.prj` (projection) degrade with a warning. Without a `.prj` shpjs assumes
 * WGS84 and the range check in `normalize.ts` is what catches projected coordinates.
 *
 * Both libraries load lazily so the ~80 kB of shpjs+proj4 never reaches the main
 * bundle.
 */
export async function parseShapefile(buffer: ArrayBuffer): Promise<ParseOutcome> {
  const [{ unzipSync }, { default: shp }] = await Promise.all([import("fflate"), import("shpjs")]);

  let entryNames: string[];

  try {
    entryNames = Object.keys(unzipSync(new Uint8Array(buffer)));
  } catch {
    throw new UploadError("unreadable", "The file could not be read as a zip archive.");
  }

  const has = (extension: string) =>
    entryNames.some((name) => name.toLowerCase().endsWith(extension));

  if (!has(".shp")) {
    throw new UploadError(
      "unreadable",
      "The zip does not contain a .shp file — it is not a zipped shapefile.",
    );
  }

  const warnings: UploadWarning[] = [];

  if (!has(".dbf")) {
    warnings.push({
      message: "No attribute table (.dbf) found — polygons were named automatically.",
    });
  }

  const missingPrj = !has(".prj");

  let result: Awaited<ReturnType<typeof shp>>;

  try {
    result = await shp(buffer);
  } catch {
    throw new UploadError(
      "unreadable",
      "The shapefile could not be read — its contents or coordinate system may be unsupported.",
    );
  }

  // A zip holding several .shp files yields an array of collections; flatten and say so,
  // since their attribute schemas may differ.
  const collections = Array.isArray(result) ? result : [result];

  if (collections.length > 1) {
    warnings.push({
      message: `The zip contains ${collections.length} shapefiles; their features were combined.`,
    });
  }

  const merged = {
    type: "FeatureCollection",
    features: collections.flatMap((collection) => collection.features),
  };

  let outcome: ParseOutcome;

  try {
    outcome = normalizeUnknown(merged, "a shapefile");
  } catch (error) {
    if (error instanceof UploadError && error.code === "bad-crs" && missingPrj) {
      throw new UploadError(
        "bad-crs",
        "Coordinates are not longitude/latitude — the shapefile is missing its .prj projection file.",
      );
    }

    throw error;
  }

  if (missingPrj) {
    warnings.push({
      message: "The shapefile has no .prj file — WGS84 coordinates were assumed.",
    });
  }

  return { features: outcome.features, warnings: [...warnings, ...outcome.warnings] };
}
