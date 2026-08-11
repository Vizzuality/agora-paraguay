/**
 * Mock data for the placeholder model. See `../schemas.ts` — throwaway.
 *
 * Nothing outside `src/lib/api/` may import this file. `client.ts` is the only
 * module that knows the data is fake; that is what makes the swap to the real API
 * a one-file change.
 */
export const placeholderFixtures = [
  { id: "one", label: "Placeholder one", value: 42 },
  { id: "two", label: "Placeholder two", value: 17 },
  { id: "three", label: "Placeholder three", value: 8 },
];

/** Empty response — the state a UI most often forgets to handle. */
export const placeholderEmptyFixture: typeof placeholderFixtures = [];
