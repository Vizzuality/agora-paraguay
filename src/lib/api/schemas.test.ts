import { describe, expect, it } from "vitest";

import { placeholderFixtures, placeholderEmptyFixture } from "./fixtures/placeholders";
import { placeholderListSchema, placeholderSchema } from "./schemas";

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
