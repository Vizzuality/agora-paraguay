import { z } from "zod";

/**
 * Placeholder model. It corresponds to nothing in the external API and exists only to
 * prove the data path end to end:
 *
 *   fixtures -> client.ts -> queries.ts -> route component
 *
 * Replace it with schemas derived from the agreed API contract rather than extending
 * it — invented schemas get mistaken for decisions.
 */
export const placeholderSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  value: z.number(),
});

export type Placeholder = z.infer<typeof placeholderSchema>;

export const placeholderListSchema = z.array(placeholderSchema);
