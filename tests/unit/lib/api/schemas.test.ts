import { describe, expect, it } from "vitest";

import { placeholderFixtures, placeholderEmptyFixture } from "@/lib/api/fixtures/placeholders";
import { placeholderListSchema, placeholderSchema } from "@/lib/api/schemas";

describe("placeholderSchema", () => {
  it("accepts a well-formed record", () => {
    const result = placeholderSchema.safeParse({ id: "one", label: "One", value: 1 });

    expect(result.success).toBe(true);
  });

  it("rejects an empty id", () => {
    const result = placeholderSchema.safeParse({ id: "", label: "One", value: 1 });

    expect(result.success).toBe(false);
  });

  it("rejects a non-numeric value rather than coercing it", () => {
    const result = placeholderSchema.safeParse({ id: "one", label: "One", value: "1" });

    expect(result.success).toBe(false);
  });

  it("rejects a record missing a required field", () => {
    const result = placeholderSchema.safeParse({ id: "one", label: "One" });

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
