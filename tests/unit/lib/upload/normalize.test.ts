import { describe, expect, it } from "vitest";

import type { UploadGeoJson } from "@/lib/upload/geojson-schema";
import { normalizeFeatures, normalizeUnknown } from "@/lib/upload/normalize";
import { UploadError } from "@/lib/upload/types";

/** A closed unit square offset by `at`, the smallest valid store polygon. */
function square(at = 0): number[][] {
  return [
    [at, at],
    [at, at + 1],
    [at + 1, at + 1],
    [at + 1, at],
    [at, at],
  ];
}

function feature(geometry: unknown, properties: Record<string, unknown> = {}) {
  return { type: "Feature", geometry, properties };
}

function collection(...features: unknown[]) {
  return { type: "FeatureCollection", features } as UploadGeoJson;
}

function polygon(properties: Record<string, unknown> = {}, ...rings: number[][][]) {
  return feature(
    { type: "Polygon", coordinates: rings.length > 0 ? rings : [square()] },
    properties,
  );
}

function code(run: () => unknown): string | null {
  try {
    run();
  } catch (error) {
    if (error instanceof UploadError) return error.code;

    throw error;
  }

  return null;
}

describe("MultiPolygon explosion", () => {
  it("explodes a MultiPolygon into independent polygons with (i/n) names", () => {
    const { features, warnings } = normalizeFeatures(
      collection(
        feature(
          { type: "MultiPolygon", coordinates: [[square(0)], [square(10)], [square(20)]] },
          { name: "Estancia Norte" },
        ),
      ),
    );

    expect(features.map((item) => item.properties.name)).toEqual([
      "Estancia Norte (1/3)",
      "Estancia Norte (2/3)",
      "Estancia Norte (3/3)",
    ]);
    expect(features.every((item) => item.geometry.type === "Polygon")).toBe(true);
    expect(warnings).toEqual([]);
  });

  it("keeps the plain name for a single-part MultiPolygon", () => {
    const { features } = normalizeFeatures(
      collection(feature({ type: "MultiPolygon", coordinates: [[square()]] }, { name: "Campo" })),
    );

    expect(features.map((item) => item.properties.name)).toEqual(["Campo"]);
  });

  it("keeps the hole-free parts when one part of a MultiPolygon has holes", () => {
    const inner = [
      [0.2, 0.2],
      [0.2, 0.4],
      [0.4, 0.4],
      [0.2, 0.2],
    ];
    const { features, warnings } = normalizeFeatures(
      collection(
        feature(
          { type: "MultiPolygon", coordinates: [[square(0)], [square(10), inner], [square(20)]] },
          { name: "Estancia" },
        ),
      ),
    );

    // The suffix is computed over all parts, so the skipped one keeps its slot.
    expect(features.map((item) => item.properties.name)).toEqual([
      "Estancia (1/3)",
      "Estancia (3/3)",
    ]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].featureName).toBe("Estancia (2/3)");
    expect(warnings[0].message).toContain("huecos");
  });
});

describe("holes", () => {
  it("skips a holed polygon with a warning naming it, keeping its siblings", () => {
    const inner = [
      [0.2, 0.2],
      [0.2, 0.4],
      [0.4, 0.4],
      [0.2, 0.2],
    ];
    const { features, warnings } = normalizeFeatures(
      collection(polygon({ name: "Holed" }, square(), inner), polygon({ name: "Clean" })),
    );

    expect(features.map((item) => item.properties.name)).toEqual(["Clean"]);
    expect(warnings[0].featureName).toBe("Holed");
  });

  it("errors when every polygon is holed, mentioning the holes", () => {
    const inner = [
      [0.2, 0.2],
      [0.2, 0.4],
      [0.4, 0.4],
      [0.2, 0.2],
    ];

    expect(code(() => normalizeFeatures(collection(polygon({}, square(), inner))))).toBe(
      "no-polygons",
    );
  });
});

describe("coordinate repair", () => {
  it("caps precision at 9 decimals, which the store enforces", () => {
    const ring = square().map(([lng, lat]) => [lng + 0.12345678912345, lat]);
    const { features } = normalizeFeatures(collection(polygon({}, ring)));

    for (const [lng] of features[0].geometry.coordinates[0]) {
      expect(String(lng).split(".")[1].length).toBeLessThanOrEqual(9);
    }
  });

  it("drops z and m values", () => {
    const ring = square().map(([lng, lat]) => [lng, lat, 120, 0]);
    const { features } = normalizeFeatures(collection(polygon({}, ring)));

    expect(features[0].geometry.coordinates[0].every((position) => position.length === 2)).toBe(
      true,
    );
  });

  it("closes an unclosed ring", () => {
    const open = square().slice(0, -1);
    const { features } = normalizeFeatures(collection(polygon({}, open)));
    const ring = features[0].geometry.coordinates[0];

    expect(ring[0]).toEqual(ring[ring.length - 1]);
    expect(ring).toHaveLength(open.length + 1);
  });

  it("rejects the whole file when any coordinate is outside lon/lat range", () => {
    const projected = square().map(([lng, lat]) => [lng + 435000, lat + 7200000]);

    expect(code(() => normalizeFeatures(collection(polygon({}), polygon({}, projected))))).toBe(
      "bad-crs",
    );
  });
});

describe("naming", () => {
  it("prefers name, then nombre, case-insensitively", () => {
    const { features } = normalizeFeatures(
      collection(
        polygon({ name: "By name", NOMBRE: "ignored" }),
        polygon({ NOMBRE: "By nombre" }),
        polygon({ TITLE: "By title" }),
      ),
    );

    expect(features.map((item) => item.properties.name)).toEqual([
      "By name",
      "By nombre",
      "By title",
    ]);
  });

  it("falls back to a 1-based Polygon N and ignores non-string values", () => {
    const { features } = normalizeFeatures(
      collection(polygon({ name: 42 }), polygon({ name: "  " }), polygon()),
    );

    expect(features.map((item) => item.properties.name)).toEqual([
      "Polígono 1",
      "Polígono 2",
      "Polígono 3",
    ]);
  });
});

describe("non-polygon input", () => {
  it("counts skipped points and lines into one warning", () => {
    const { features, warnings } = normalizeFeatures(
      collection(
        polygon({ name: "Kept" }),
        feature({ type: "Point", coordinates: [0, 0] }),
        feature({
          type: "LineString",
          coordinates: [
            [0, 0],
            [1, 1],
          ],
        }),
      ),
    );

    expect(features).toHaveLength(1);
    expect(warnings).toEqual([{ message: "Se omitieron 2 entidades que no son polígonos." }]);
  });

  it("recurses one level into a GeometryCollection and skips deeper nesting", () => {
    const { features, warnings } = normalizeFeatures(
      collection(
        feature(
          {
            type: "GeometryCollection",
            geometries: [
              { type: "Polygon", coordinates: [square()] },
              { type: "GeometryCollection", geometries: [] },
            ],
          },
          { name: "Mixed" },
        ),
      ),
    );

    expect(features).toHaveLength(1);
    expect(warnings).toEqual([{ message: "Se omitió 1 entidad que no es un polígono." }]);
  });

  it("errors naming what was found when nothing is importable", () => {
    let caught: UploadError | undefined;

    try {
      normalizeFeatures(
        collection(
          feature({ type: "Point", coordinates: [0, 0] }),
          feature({ type: "Point", coordinates: [1, 1] }),
        ),
      );
    } catch (error) {
      caught = error as UploadError;
    }

    expect(caught?.code).toBe("no-polygons");
    expect(caught?.message).toContain("2 puntos");
  });

  it("errors on an empty FeatureCollection", () => {
    expect(code(() => normalizeFeatures(collection()))).toBe("empty");
  });
});

describe("root forms and ids", () => {
  it("accepts a lone Feature and a bare geometry as the file root", () => {
    expect(normalizeFeatures(polygon({ name: "Lone" }) as UploadGeoJson).features).toHaveLength(1);
    expect(
      normalizeFeatures({ type: "Polygon", coordinates: [square()] } as UploadGeoJson).features,
    ).toHaveLength(1);
  });

  it("mints a unique id per feature so auto-select can address them", () => {
    const { features } = normalizeFeatures(
      collection(feature({ type: "MultiPolygon", coordinates: [[square(0)], [square(10)]] })),
    );

    expect(new Set(features.map((item) => item.id)).size).toBe(features.length);
  });
});

describe("normalizeUnknown", () => {
  it("rejects values that are not GeoJSON with an unreadable error", () => {
    expect(code(() => normalizeUnknown({ hello: "world" }, "GeoJSON"))).toBe("unreadable");
  });
});
