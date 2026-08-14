import { describe, expect, it } from "vitest";

import { fetchPlaceholders } from "@/lib/api/client";
import { placeholderListSchema } from "@/lib/api/schemas";

describe("fetchPlaceholders", () => {
  it("returns data that satisfies the schema", async () => {
    const data = await fetchPlaceholders();

    expect(() => placeholderListSchema.parse(data)).not.toThrow();
    expect(data.length).toBeGreaterThan(0);
  });

  it("returns parsed objects, not the raw fixture reference", async () => {
    const first = await fetchPlaceholders();
    const second = await fetchPlaceholders();

    // Zod returns a new object per parse; mutating one caller's result must not
    // leak into the next. This is the bug that hides until two components share a
    // fixture-backed query.
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });
});
