import { parcelLabel } from './parcel-label';

/** Lower case, accents and outer spaces dropped, so "PARCELA 3 " finds "Parcela 3". */
function normalized(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * The analysed parcels whose "Parcela N" label or cadastral id contains the query, in
 * selection order; every parcel for an empty query.
 */
export function searchParcels(parcelIds: readonly string[], query: string): string[] {
  const wanted = normalized(query);

  if (wanted === '') return [...parcelIds];

  return parcelIds.filter(
    (parcelId) =>
      normalized(parcelLabel(parcelId, parcelIds)).includes(wanted) ||
      normalized(parcelId).includes(wanted),
  );
}
