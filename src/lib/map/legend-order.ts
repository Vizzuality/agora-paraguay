/*
 * The legend's row controls, as pure steps: hiding a row, and stacking a set of map layers
 * in the order their rows read. Node-tested.
 */

/**
 * Each layer's `beforeId` so they paint in `topFirst` order (the legend's, top row on top):
 * every layer sits right under the one listed above it, the first under `topBeforeId`.
 * Applied top first, each move lands under a layer already in place, so any previous
 * order ends up as listed.
 */
export function stackBeforeIds(
  topFirst: readonly string[],
  topBeforeId: string,
): Record<string, string> {
  return Object.fromEntries(
    topFirst.map((id, index) => [id, index === 0 ? topBeforeId : topFirst[index - 1]]),
  );
}

/** `ids` with `id` added, or taken out when it is there. */
export function toggled(ids: ReadonlySet<string>, id: string): Set<string> {
  const result = new Set(ids);
  if (!result.delete(id)) result.add(id);

  return result;
}
