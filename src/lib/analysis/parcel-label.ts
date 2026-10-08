/**
 * N for "Parcela N": the parcel's 1-based position in the analysed selection, `null`
 * for an id outside it. The cadastral id keeps driving state and matching; only what
 * users see changes.
 */
export function parcelNumber(parcelId: string, parcelIds: readonly string[]): number | null {
  const index = parcelIds.indexOf(parcelId);

  return index === -1 ? null : index + 1;
}

/** How the UI names an analysed parcel: "Parcela N"; an id outside the selection stays as is. */
export function parcelLabel(parcelId: string, parcelIds: readonly string[]): string {
  const number = parcelNumber(parcelId, parcelIds);

  return number === null ? parcelId : `Parcela ${number}`;
}
