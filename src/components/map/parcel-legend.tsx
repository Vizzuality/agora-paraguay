import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { type CSSProperties, useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { parcelQueries } from '@/lib/api/parcels/queries';
import { cn } from '@/lib/utils';
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

const ITEMS = [
  { label: 'Selección activa', className: 'border-2 border-black/50 bg-parcel' },
  { label: 'Soja', className: 'bg-black', style: SOJA_SWATCH },
  { label: 'Arroz', className: 'border-2 border-white bg-black', style: ARROZ_SWATCH },
];

/** What the parcels' colours and textures mean, folded behind a button. Shown once parcels are on the map. */
export function ParcelLegend({ className }: Readonly<{ className?: string }>) {
  const polygons = useAtomValue(drawPolygonsAtom);
  const { data } = useQuery(parcelQueries.filtered(polygons));
  const [open, setOpen] = useState(false);
  const id = useId();

  if ((data?.results.length ?? 0) === 0) return null;

  return (
    <div className={cn('absolute z-10 flex w-52 flex-col items-start gap-1', className)}>
      <Button
        variant="secondary"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        className="h-12 rounded-2xl border px-8 font-normal text-primary"
      >
        {open ? 'Ocultar leyenda' : 'Mostrar leyenda'}
      </Button>
      {open && (
        <ul
          id={id}
          className="flex w-full flex-col gap-1 rounded-2xl bg-background py-2 pr-2 pl-4 backdrop-blur-xs"
        >
          {ITEMS.map((item) => (
            <li key={item.label} className="flex h-7.5 items-center gap-1 text-xs text-foreground">
              <span
                aria-hidden
                className={cn('size-4 shrink-0 rounded-full', item.className)}
                style={item.style}
              />
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
