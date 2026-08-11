import { z } from "zod";

/**
 * THROWAWAY PLACEHOLDER.
 *
 * The external API does not exist yet and its contract has not been agreed, so this
 * models nothing real. It exists only to prove the data path end to end:
 *
 *   fixtures -> client.ts -> queries.ts -> route component
 *
 * Delete this file when the real contract lands. Do not grow it into a domain model
 * by accident — schemas invented before the contract get mistaken for decisions.
 */
export const placeholderSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  value: z.number(),
});

export type Placeholder = z.infer<typeof placeholderSchema>;

export const placeholderListSchema = z.array(placeholderSchema);
