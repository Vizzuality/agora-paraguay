import {
  uploadGeoJsonSchema,
  type UploadFeatureInput,
  type UploadGeoJson,
  type UploadGeometry,
} from "@/lib/upload/geojson-schema";
import {
  UploadError,
  type LngLat,
  type ParseOutcome,
  type UploadFeature,
  type UploadWarning,
} from "@/lib/upload/types";

/**
 * Where every parser converges: validated GeoJSON in, store-ready polygons out.
 *
 * Terra Draw's store only takes `Polygon` features with 9-decimal coordinates and no
 * interior rings (pinned by `tests/unit/lib/map/terra-draw-api.test.ts`), while real
 * uploads carry MultiPolygons, z values, unclosed rings and holes. This module closes
 * that gap — pure and node-testable, which is why the browser-only parsers stay thin.
 */

/** Terra Draw rejects coordinates with more than 9 decimals (≈ 0.1 mm). */
const COORDINATE_DECIMALS = 9;

/**
 * Property keys accepted as a polygon's display name, in order of preference and
 * compared case-insensitively: `NOMBRE` is what Paraguayan DBF columns tend to hold,
 * `name` is what togeojson extracts from KML.
 */
const NAME_KEYS = ["name", "nombre", "title", "label", "id"];

type Ring = number[][];

type SkipCounts = {
  points: number;
  lines: number;
  nested: number;
};

/** Validates a parsed-but-untrusted GeoJSON value, then normalises it. */
export function normalizeUnknown(value: unknown, description: string): ParseOutcome {
  const parsed = uploadGeoJsonSchema.safeParse(value);

  if (!parsed.success) {
    throw new UploadError("unreadable", `The file could not be read as ${description}.`);
  }

  return normalizeFeatures(parsed.data);
}

export function normalizeFeatures(root: UploadGeoJson): ParseOutcome {
  const inputs = toFeatureInputs(root);

  if (inputs.length === 0) {
    throw new UploadError("empty", "The file contains no features.");
  }

  const features: UploadFeature[] = [];
  const warnings: UploadWarning[] = [];
  const skipped: SkipCounts = { points: 0, lines: 0, nested: 0 };
  let holed = 0;
  let unnamed = 0;

  for (const input of inputs) {
    const parts = input.geometry === null ? [] : polygonParts(input.geometry, skipped);

    if (parts.length === 0) continue;

    const name = featureName(input.properties) ?? `Polygon ${++unnamed}`;

    parts.forEach((rings, index) => {
      // MultiPolygon parts become independent polygons (user-confirmed): the suffix is
      // computed over all parts, so a skipped holed part still has a nameable slot.
      const partName = parts.length > 1 ? `${name} (${index + 1}/${parts.length})` : name;

      if (rings.length > 1) {
        holed += 1;
        warnings.push({
          featureName: partName,
          // Skipped rather than stripped: silently deleting interior rings would
          // inflate the farm's area for any future analysis.
          message: `"${partName}" has interior rings (holes) and was skipped — remove them in the source data.`,
        });
        return;
      }

      features.push({
        id: crypto.randomUUID(),
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [closeRing(cleanRing(rings[0]))] },
        properties: { mode: "polygon", origin: "upload", name: partName },
      });
    });
  }

  // One projected coordinate means the whole file's CRS is suspect, so nothing from it
  // may reach the store — a shapefile without its .prj is the usual culprit.
  const outOfRange = features.some((feature) =>
    feature.geometry.coordinates[0].some(([lng, lat]) => Math.abs(lng) > 180 || Math.abs(lat) > 90),
  );

  if (outOfRange) {
    throw new UploadError(
      "bad-crs",
      "Coordinates are not longitude/latitude — the file's coordinate system could not be read.",
    );
  }

  if (features.length === 0) {
    throw new UploadError("no-polygons", noPolygonsMessage(skipped, holed));
  }

  const nonPolygons = skipped.points + skipped.lines + skipped.nested;

  if (nonPolygons > 0) {
    warnings.push({
      message: `Skipped ${nonPolygons} non-polygon feature${nonPolygons === 1 ? "" : "s"}.`,
    });
  }

  return { features, warnings };
}

/** The file root may be a FeatureCollection, a lone Feature, or a bare geometry. */
function toFeatureInputs(root: UploadGeoJson): UploadFeatureInput[] {
  if (root.type === "FeatureCollection") return root.features;
  if (root.type === "Feature") return [root];

  return [{ type: "Feature", geometry: root, properties: {} }];
}

/**
 * The polygons a geometry contains, each as its raw ring list. Recurses one level into
 * GeometryCollections; deeper nesting and non-areal types are only counted.
 */
function polygonParts(geometry: UploadGeometry, skipped: SkipCounts, depth = 0): Ring[][] {
  switch (geometry.type) {
    case "Polygon":
      return [geometry.coordinates];

    case "MultiPolygon":
      return geometry.coordinates;

    case "GeometryCollection":
      if (depth >= 1) {
        skipped.nested += 1;

        return [];
      }

      return geometry.geometries.flatMap((member) => polygonParts(member, skipped, depth + 1));

    case "Point":
    case "MultiPoint":
      skipped.points += 1;

      return [];

    case "LineString":
    case "MultiLineString":
      skipped.lines += 1;

      return [];
  }
}

function featureName(properties: UploadFeatureInput["properties"]): string | null {
  if (!properties) return null;

  for (const wanted of NAME_KEYS) {
    for (const [key, value] of Object.entries(properties)) {
      if (key.toLowerCase() === wanted && typeof value === "string" && value.trim() !== "") {
        return value.trim();
      }
    }
  }

  return null;
}

/** Drops z/m and caps precision, the two store constraints every source can violate. */
function cleanRing(ring: Ring): LngLat[] {
  return ring.map((position) => [roundCoordinate(position[0]), roundCoordinate(position[1])]);
}

/**
 * `toFixed` rather than arithmetic rounding: the store checks the number of printed
 * decimals, and re-parsing the fixed string is what guarantees that count.
 */
function roundCoordinate(value: number): number {
  return Number(value.toFixed(COORDINATE_DECIMALS));
}

/** Hand-made GeoJSON often leaves rings unclosed; the store wants first === last. */
function closeRing(ring: LngLat[]): LngLat[] {
  const first = ring[0];
  const last = ring[ring.length - 1];

  if (first[0] === last[0] && first[1] === last[1]) return ring;

  return [...ring, [first[0], first[1]]];
}

function noPolygonsMessage(skipped: SkipCounts, holed: number): string {
  const found: string[] = [];

  if (holed > 0) found.push(`${holed} polygon${holed === 1 ? "" : "s"} with holes`);
  if (skipped.points > 0) found.push(`${skipped.points} point${skipped.points === 1 ? "" : "s"}`);
  if (skipped.lines > 0) found.push(`${skipped.lines} line${skipped.lines === 1 ? "" : "s"}`);
  if (skipped.nested > 0)
    found.push(`${skipped.nested} nested collection${skipped.nested === 1 ? "" : "s"}`);

  return found.length > 0
    ? `The file contains no importable polygons — found ${found.join(", ")}.`
    : "The file contains no importable polygons.";
}
