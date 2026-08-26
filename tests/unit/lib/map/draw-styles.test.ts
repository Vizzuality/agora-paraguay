import type { GeoJSONStoreFeatures } from "terra-draw";
import { describe, expect, it } from "vitest";

import { dotPatternImage, PARCEL_STYLES } from "@/lib/map/draw-styles";

function parcel(id: string, properties: Record<string, unknown> = {}): GeoJSONStoreFeatures {
  return {
    id,
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-58, -24],
          [-58, -23.9],
          [-57.9, -23.9],
          [-58, -24],
        ],
      ],
    },
    properties: { mode: "polygon", ...properties },
  } as GeoJSONStoreFeatures;
}

describe("PARCEL_STYLES", () => {
  it("paints the analysis selection yellow, whatever its origin", () => {
    const selected = parcel("a", { origin: "upload", analysis: true });

    expect(PARCEL_STYLES.fillColor(selected)).toBe("#F1FF28");
    expect(PARCEL_STYLES.fillOpacity(selected)).toBe(0.5);
    expect(PARCEL_STYLES.outlineColor(selected)).toBe("#F1FF28");
    expect(PARCEL_STYLES.outlineWidth(selected)).toBe(2);
  });

  it("paints uploaded parcels white", () => {
    const uploaded = parcel("u", { origin: "upload" });

    expect(PARCEL_STYLES.fillColor(uploaded)).toBe("#FFFFFF");
    expect(PARCEL_STYLES.fillOpacity(uploaded)).toBe(0.1);
    expect(PARCEL_STYLES.outlineColor(uploaded)).toBe("#FFFFFF");
    expect(PARCEL_STYLES.outlineWidth(uploaded)).toBe(2);
  });

  it("leaves hand-drawn parcels on Terra Draw defaults", () => {
    const drawn = parcel("d");

    expect(PARCEL_STYLES.fillColor(drawn)).toBeUndefined();
    expect(PARCEL_STYLES.fillOpacity(drawn)).toBeUndefined();
    expect(PARCEL_STYLES.outlineColor(drawn)).toBeUndefined();
    expect(PARCEL_STYLES.outlineWidth(drawn)).toBeUndefined();
  });

  it("requires the analysis flag to be literally true, not merely set", () => {
    expect(PARCEL_STYLES.fillColor(parcel("a", { analysis: false }))).toBeUndefined();
    expect(PARCEL_STYLES.fillColor(parcel("a", { analysis: "yes" }))).toBeUndefined();
  });
});

describe("dotPatternImage", () => {
  it("produces an RGBA tile of the requested size", () => {
    const image = dotPatternImage(50);

    expect(image.width).toBe(50);
    expect(image.height).toBe(50);
    expect(image.data).toHaveLength(50 * 50 * 4);
  });

  it("draws an opaque-ish dot at the center and nothing at the corner", () => {
    const image = dotPatternImage(50, 2, 178);
    const center = (25 * 50 + 25) * 4;

    expect(image.data[center + 3]).toBe(178);
    expect(image.data[3]).toBe(0);
  });
});
