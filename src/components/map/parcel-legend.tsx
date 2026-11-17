import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import type { CSSProperties } from 'react';

import { MapLegend, type MapLegendItem } from '@/components/map/map-legend';
import { parcelQueries } from '@/lib/api/parcels/queries';
import { drawPolygonsAtom } from '@/store/draw';

/** The map's crop textures at swatch size: white stripes and dots over black. */
const SOJA_SWATCH: CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(-60deg, rgb(255 255 255 / 0.7) 0 1.5px, transparent 1.5px 4px)',
};
const ARROZ_SWATCH: CSSProperties = {
  backgroundImage: 'radial-gradient(rgb(255 255 255 / 0.5) 1px, transparent 1.25px)',
  backgroundSize: '4px 4px',
};

const ITEMS: MapLegendItem[] = [
  { id: 'selection', label: 'Selección activa', className: 'border-2 border-black/50 bg-parcel' },
  { id: 'soja', label: 'Soja', className: 'bg-black', style: SOJA_SWATCH },
  { id: 'arroz', label: 'Arroz', className: 'border-2 border-white bg-black', style: ARROZ_SWATCH },
];

/** What the parcels' colours and textures mean. Shown once parcels are on the map. */
export function ParcelLegend({ className }: Readonly<{ className?: string }>) {
  const polygons = useAtomValue(drawPolygonsAtom);
  const { data } = useQuery(parcelQueries.filtered(polygons));

  if ((data?.results.length ?? 0) === 0) return null;

  return <MapLegend label="Leyenda de parcelas" items={ITEMS} className={className} />;
}
