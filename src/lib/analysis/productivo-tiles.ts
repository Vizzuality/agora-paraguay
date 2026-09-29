import { categoryCountTiles, type CategoryCountTile } from '@/lib/analysis/category-counts';
import { parcelValueTiles, type ParcelValuesTile } from '@/lib/analysis/parcel-values';
import type { AnalysisParcel } from '@/lib/api/analysis/schemas';
import type { Indicators } from '@/lib/api/metadata/schemas';

export type ProductivoTile =
  | ({ kind: 'parcel-values' } & ParcelValuesTile)
  | ({ kind: 'category-count' } & CategoryCountTile);

/** Every productivo tile the shown indicators produce, in metadata order, whatever its kind. */
export function productivoTiles(
  parcels: AnalysisParcel[],
  parcelIds: string[],
  indicators: Indicators | undefined,
): ProductivoTile[] {
  const values = new Map(
    parcelValueTiles(parcels, parcelIds, indicators, 'productivo').map((tile) => [tile.id, tile]),
  );
  const counts = new Map(
    categoryCountTiles(parcels, parcelIds, indicators, 'productivo').map((tile) => [tile.id, tile]),
  );
  console.log('values', values, counts, parcels);
  return (indicators ?? []).flatMap((indicator): ProductivoTile[] => {
    const value = values.get(indicator.id);
    if (value) return [{ kind: 'parcel-values' as const, ...value }];

    const count = counts.get(indicator.id);
    if (count) return [{ kind: 'category-count' as const, ...count }];

    return [];
  });
}
