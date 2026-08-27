import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { placeholderFixtures, placeholderEmptyFixture } from "@/lib/api/fixtures/placeholders";
import {
  analysisRequestSchema,
  analysisResponseSchema,
  placeholderListSchema,
  placeholderSchema,
  toAnalysisRequest,
  type ParcelFeature,
} from "@/lib/api/schemas";
import type { DrawnPolygon } from "@/lib/map/draw-features";

/** A closed unit square, the smallest valid ring. */
const SQUARE = [
  [0, 0],
  [0, 1],
  [1, 1],
  [1, 0],
  [0, 0],
];

function requestFeature(geometry: unknown, name = "Área") {
  return { type: "Feature", properties: { name }, geometry };
}

function polygonGeometry() {
  return { type: "Polygon", coordinates: [SQUARE] };
}

/** A DrawnPolygon as Terra Draw stores it, internals included. */
function drawnPolygon(id: string, properties: Record<string, unknown> = {}): DrawnPolygon {
  return {
    id,
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [SQUARE] },
    properties: { mode: "polygon", currentlyDrawing: false, ...properties },
  } as DrawnPolygon;
}

describe("placeholderSchema", () => {
  const valid = { id: "one", title: "One", value: 1, description: "70% of parcels · 2024" };

  it("accepts a well-formed record", () => {
    const result = placeholderSchema.safeParse(valid);

    expect(result.success).toBe(true);
  });

  it("rejects an empty id", () => {
    const result = placeholderSchema.safeParse({ ...valid, id: "" });

    expect(result.success).toBe(false);
  });

  it("rejects an empty description", () => {
    const result = placeholderSchema.safeParse({ ...valid, description: "" });

    expect(result.success).toBe(false);
  });

  it("rejects a non-numeric value rather than coercing it", () => {
    const result = placeholderSchema.safeParse({ ...valid, value: "1" });

    expect(result.success).toBe(false);
  });

  it("rejects a record missing a required field", () => {
    const { description: _description, ...withoutDescription } = valid;

    const result = placeholderSchema.safeParse(withoutDescription);

    expect(result.success).toBe(false);
  });
});

describe("analysisRequestSchema", () => {
  it("accepts a FeatureCollection with a Polygon feature", () => {
    const result = analysisRequestSchema.safeParse({
      type: "FeatureCollection",
      features: [requestFeature(polygonGeometry())],
    });

    expect(result.success).toBe(true);
  });

  it("accepts a MultiPolygon geometry — the contract allows both", () => {
    const result = analysisRequestSchema.safeParse({
      type: "FeatureCollection",
      features: [requestFeature({ type: "MultiPolygon", coordinates: [[SQUARE], [SQUARE]] })],
    });

    expect(result.success).toBe(true);
  });

  it("rejects a non-areal geometry", () => {
    const result = analysisRequestSchema.safeParse({
      type: "FeatureCollection",
      features: [requestFeature({ type: "Point", coordinates: [0, 0] })],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty features array", () => {
    const result = analysisRequestSchema.safeParse({ type: "FeatureCollection", features: [] });

    expect(result.success).toBe(false);
  });

  it("rejects a feature with an empty name", () => {
    const result = analysisRequestSchema.safeParse({
      type: "FeatureCollection",
      features: [requestFeature(polygonGeometry(), "")],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a ring with fewer than 4 positions", () => {
    const result = analysisRequestSchema.safeParse({
      type: "FeatureCollection",
      features: [requestFeature({ type: "Polygon", coordinates: [SQUARE.slice(0, 3)] })],
    });

    expect(result.success).toBe(false);
  });
});

describe("analysisResponseSchema", () => {
  it("accepts an accepted response", () => {
    const result = analysisResponseSchema.safeParse({
      id: "6f3a2f6e-7f7a-4a3e-9a3e-2f6e7f7a4a3e",
      status: "accepted",
      receivedFeatures: 2,
    });

    expect(result.success).toBe(true);
  });

  it("rejects any status other than accepted", () => {
    const result = analysisResponseSchema.safeParse({
      id: "6f3a2f6e-7f7a-4a3e-9a3e-2f6e7f7a4a3e",
      status: "ok",
      receivedFeatures: 2,
    });

    expect(result.success).toBe(false);
  });
});

describe("toAnalysisRequest", () => {
  it("names features from properties.name, falling back to the list position", () => {
    const request = toAnalysisRequest([
      drawnPolygon("a", { name: "Estancia", origin: "upload" }),
      drawnPolygon("b"),
    ]);

    expect(request.features.map((feature) => feature.properties.name)).toEqual([
      "Estancia",
      "Área dibujada 2",
    ]);
  });

  it("strips Terra Draw's internal properties from the payload", () => {
    const request = toAnalysisRequest([drawnPolygon("a", { origin: "upload", name: "Campo" })]);

    expect(Object.keys(request.features[0].properties)).toEqual(["name"]);
  });

  it("returns fresh geometry, never aliasing the draw store", () => {
    const polygon = drawnPolygon("a");
    const request = toAnalysisRequest([polygon]);

    expect(request.features[0].geometry).toEqual(polygon.geometry);
    expect(request.features[0].geometry).not.toBe(polygon.geometry);
    expect(request.features[0].geometry.coordinates).not.toBe(polygon.geometry.coordinates);
  });

  it("throws on an empty polygon list — the contract wants at least one feature", () => {
    expect(() => toAnalysisRequest([])).toThrow(ZodError);
  });

  it("accepts cadastral parcel features alongside drawn polygons, named and id-stripped", () => {
    const parcel = {
      type: "Feature",
      properties: { id: "p-1", name: "Parcela 12-3" },
      geometry: { type: "Polygon", coordinates: [SQUARE] },
    } as ParcelFeature;

    const request = toAnalysisRequest([drawnPolygon("a"), parcel]);

    expect(request.features.map((feature) => feature.properties.name)).toEqual([
      "Área dibujada 1",
      "Parcela 12-3",
    ]);
    // The contract's feature schema declares `name` only: the parcel's `id` goes.
    expect(Object.keys(request.features[1].properties)).toEqual(["name"]);
  });
});

describe("fixtures", () => {
  // The fixtures are the app's only data source. If they drift from the schema,
  // every downstream assumption drifts with them silently.
  it("conform to the schema", () => {
    expect(() => placeholderListSchema.parse(placeholderFixtures)).not.toThrow();
  });

  it("cover the empty case", () => {
    expect(placeholderListSchema.parse(placeholderEmptyFixture)).toEqual([]);
  });
});
