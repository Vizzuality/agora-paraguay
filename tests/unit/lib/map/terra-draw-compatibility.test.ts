import type { Map as MapLibreMap } from "maplibre-gl";
import { describe, expect, it } from "vitest";

/**
 * The MapLibre API surface `terra-draw-maplibre-gl-adapter` uses, read off its bundled
 * source.
 *
 * The adapter's own types cannot catch a breaking MapLibre release: its `map` parameter
 * is an unconstrained generic (`TerraDrawMapLibreGLAdapter<MapType>`), so it accepts
 * anything and its declared peer range is an open `>=4`. Nothing in the install or the
 * build would fail if MapLibre dropped one of these methods — the map would simply
 * throw the first time someone drew a shape.
 *
 * The `satisfies` clause below is the actual test, and it runs under `typecheck`: if a
 * MapLibre upgrade removes or renames any of these, the name stops being a `keyof Map`
 * and compilation fails.
 */
const ADAPTER_MAP_METHODS = [
  "addImage",
  "addLayer",
  "addSource",
  "getCanvas",
  "getContainer",
  "getSource",
  "hasImage",
  "loadImage",
  "moveLayer",
  "project",
  "removeLayer",
  "removeSource",
  "unproject",
  "dragPan",
  "dragRotate",
] as const satisfies readonly (keyof MapLibreMap)[];

describe("terra-draw MapLibre adapter", () => {
  it("depends on a surface MapLibre still declares", () => {
    // The assertion that matters is the `satisfies` above, checked at compile time.
    // This keeps the guard visible in the test run rather than only in tsc output.
    expect(ADAPTER_MAP_METHODS).toHaveLength(15);
  });
});
