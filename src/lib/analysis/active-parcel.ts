/**
 * The hero tab in force: the stored parcel while it is still among the submitted ones,
 * else Todas (`null`) — a re-run with another selection must not keep pointing at a
 * parcel that is gone. Pure, node-tested; the tabs, the widgets and the mini map all
 * resolve through here so they agree.
 */
export function resolveActiveParcel(parcelIds: string[], stored: string | null): string | null {
  return stored !== null && parcelIds.includes(stored) ? stored : null;
}
