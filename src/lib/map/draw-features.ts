import type { GeoJSONStoreFeatures, GeoJSONStoreGeometries, TerraDrawExtend } from "terra-draw";

export type FeatureId = TerraDrawExtend.FeatureId;

// `geojson` is only a transitive dependency, so the geometry type is pulled out of the
// union Terra Draw already exports rather than imported directly.
type PolygonGeometry = Extract<GeoJSONStoreGeometries, { type: "Polygon" }>;

/** A finished polygon drawn by the user, as Terra Draw stores it. */
export type DrawnPolygon = GeoJSONStoreFeatures<PolygonGeometry> & { id: FeatureId };

/**
 * Terra Draw keeps everything in one store: the drawn polygons, but also the selection
 * points, midpoints, closing points and snapping points that select mode renders, plus
 * the in-progress ring while a polygon is being drawn.
 *
 * So the drawn polygons are always a filtered derivation — never the raw snapshot.
 * The `mode` and `currentlyDrawing` property names are Terra Draw's internal
 * `COMMON_PROPERTIES`, which the package does not export; the tests in
 * `draw-features.test.ts` are what pin them.
 */
export function isDrawnPolygon(feature: GeoJSONStoreFeatures): feature is DrawnPolygon {
  return (
    feature.id !== undefined &&
    feature.geometry.type === "Polygon" &&
    feature.properties.mode === "polygon" &&
    feature.properties.currentlyDrawing !== true
  );
}

/** Every finished polygon in the store, in the order Terra Draw holds them. */
export function drawnPolygons(snapshot: GeoJSONStoreFeatures[]): DrawnPolygon[] {
  return snapshot.filter(isDrawnPolygon);
}
