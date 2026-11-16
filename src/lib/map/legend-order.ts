import type { ExpressionSpecification } from 'maplibre-gl';

/*
 * The legend's row controls, as pure steps: moving a row, and stacking a set of map layers
 * in the order their rows read. Node-tested.
 */

/** `ids` with the one at `from` moved to `to`; out-of-range moves return them unchanged. */
export function moveItem<T>(ids: readonly T[], from: number, to: number): T[] {
  const result = [...ids];
  if (from === to || from < 0 || to < 0 || from >= ids.length || to >= ids.length) return result;

  const [moved] = result.splice(from, 1);
  result.splice(to, 0, moved);

  return result;
}

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

/** `items` in `order` (by `key`); items `order` does not name follow, as given. */
export function ordered<T>(
  items: readonly T[],
  order: readonly string[],
  key: (item: T) => string,
): T[] {
  const rank = (item: T) => {
    const index = order.indexOf(key(item));
    return index === -1 ? order.length : index;
  };

  return items.toSorted((a, b) => rank(a) - rank(b));
}

/** `ids` with `id` added, or taken out when it is there. */
export function toggled(ids: ReadonlySet<string>, id: string): Set<string> {
  const result = new Set(ids);
  if (!result.delete(id)) result.add(id);

  return result;
}

/** A layer's opacity faded to the legend's `share` (0–1); as it is with none set. */
export function scaledOpacity(
  base: number | ExpressionSpecification,
  share: number | undefined,
): number | ExpressionSpecification {
  if (share === undefined) return base;

  return typeof base === 'number' ? base * share : ['*', base, share];
}
