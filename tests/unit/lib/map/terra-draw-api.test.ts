import type { TerraDraw, TerraDrawEvents } from "terra-draw";
import { describe, expect, it } from "vitest";

/**
 * The Terra Draw surface `use-terra-draw.ts` and `providers/draw.tsx` depend on.
 *
 * Same idea as `terra-draw-compatibility.test.ts` one level up: the `satisfies` clauses
 * are the real assertions and they run under `typecheck`, so a Terra Draw upgrade that
 * renames an event or a method fails the build instead of failing silently on the map.
 */
const SUBSCRIBED_EVENTS = [
  "finish",
  "change",
  "select",
  "deselect",
] as const satisfies readonly TerraDrawEvents[];

const USED_METHODS = [
  "start",
  "stop",
  "on",
  "off",
  "setMode",
  "getSnapshot",
  "removeFeatures",
  "selectFeature",
  "deselectFeature",
  "clear",
  "enabled",
] as const satisfies readonly (keyof TerraDraw)[];

describe("terra-draw API", () => {
  it("subscribes to events Terra Draw still declares", () => {
    // The assertion that matters is the `satisfies` above, checked at compile time.
    expect(new Set(SUBSCRIBED_EVENTS).size).toBe(SUBSCRIBED_EVENTS.length);
  });

  it("calls methods Terra Draw still declares", () => {
    expect(new Set(USED_METHODS).size).toBe(USED_METHODS.length);
  });
});
