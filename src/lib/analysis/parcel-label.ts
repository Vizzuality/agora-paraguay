/**
 * How the UI names an analysed parcel: "Parcela N", N its 1-based position in the
 * analysed selection. The cadastral id keeps driving state and matching; only the text
 * users see changes. An id outside the selection falls back to the id itself.
 */
export function parcelLabel(parcelId: string, parcelIds: readonly string[]): string {
  const index = parcelIds.indexOf(parcelId);

  return index === -1 ? parcelId : `Parcela ${index + 1}`;
}
