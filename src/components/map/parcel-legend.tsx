import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { MapLegend, type MapLegendItem } from '@/components/map/map-legend';
import { parcelQueries } from '@/lib/api/parcels/queries';
import { PARCEL_LEGEND_LABELS, PARCEL_LEGEND_NOTE } from '@/lib/platform-metadata';
import { drawPolygonsAtom } from '@/store/draw';

const ITEMS: MapLegendItem[] = [
  {
    id: 'selection',
    label: PARCEL_LEGEND_LABELS.selection,
    swatch: { fill: 'var(--color-parcel)', edge: 'rgb(0 0 0 / 0.5)' },
  },
  { id: 'soja', label: PARCEL_LEGEND_LABELS.soja, swatch: { fill: 'black', pattern: 'stripes' } },
  {
    id: 'arroz',
    label: PARCEL_LEGEND_LABELS.arroz,
    swatch: { fill: 'black', edge: 'white', pattern: 'dots' },
  },
];

/** What the parcels' colours and textures mean. Shown once parcels are on the map. */
export function ParcelLegend({ className }: Readonly<{ className?: string }>) {
  const polygons = useAtomValue(drawPolygonsAtom);
  const { data } = useQuery(parcelQueries.filtered(polygons));

  if ((data?.results.length ?? 0) === 0) return null;

  return (
    <MapLegend
      label="Leyenda de parcelas"
      items={ITEMS}
      note={PARCEL_LEGEND_NOTE ?? undefined}
      className={className}
    />
  );
}
