/**
 * Mock data for the placeholder model. See `../schemas.ts`.
 *
 * Nothing outside `src/lib/api/` may import this file. `client.ts` is the only
 * module that knows the data is fake; that is what makes the swap to the real API
 * a one-file change.
 */
// The shares are consistent with the values on purpose: 42 + 12 + 6 = 60 parcels, so
// the percentages add up to 100. Fixtures whose numbers contradict each other train
// everyone to stop trusting them.
export const placeholderFixtures = [
  { id: 'one', title: 'Parcelas de soja', value: 42, description: '70% de las parcelas · 2024' },
  { id: 'two', title: 'Parcelas ganaderas', value: 12, description: '20% de las parcelas · 2024' },
  { id: 'three', title: 'Reserva forestal', value: 6, description: '10% de las parcelas · 2024' },
];

/** Empty response — the state a UI most often forgets to handle. */
export const placeholderEmptyFixture: typeof placeholderFixtures = [];
