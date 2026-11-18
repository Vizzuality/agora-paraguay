import { Eye, EyeOff } from 'lucide-react';
import { type CSSProperties, useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type MapLegendItem = {
  id: string;
  label: string;
  /** The swatch's classes over its 16px disc. */
  className?: string;
  style?: CSSProperties;
};

type MapLegendProps = {
  label: string;
  /** In the order the rows read. */
  items: MapLegendItem[];
  className?: string;
  /** The rows the map hides; with `onToggle`, each row gets its eye. */
  hidden?: ReadonlySet<string>;
  onToggle?: (id: string) => void;
};

const CONTROL_CLASS =
  'flex shrink-0 print:hidden cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';

/**
 * A map's key, bottom left: Mostrar/Ocultar leyenda over the swatches on a light panel,
 * open until folded. Every map's legend uses it, so they read and fold alike. A map that
 * lets its rows be hidden passes `onToggle`, and each row grows an eye.
 */
export function MapLegend({ label, items, className, hidden, onToggle }: Readonly<MapLegendProps>) {
  const [open, setOpen] = useState(true);
  const id = useId();

  return (
    <div
      className={cn(
        'absolute z-10 flex min-w-52 flex-col items-start gap-1 print:min-w-0',
        className,
      )}
    >
      <Button
        variant="secondary"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        className="h-12 rounded-2xl border px-8 font-normal text-primary print:hidden"
      >
        {open ? 'Ocultar leyenda' : 'Mostrar leyenda'}
      </Button>
      {/* Folded, the rows still print: the report always carries its key. */}
      <ul
        id={id}
        aria-label={label}
        className={cn(
          'flex w-full flex-col gap-1 rounded-2xl bg-background py-2 pr-2 pl-4 backdrop-blur-xs print:gap-0 print:rounded-lg print:py-1 print:pl-2',
          !open && 'hidden print:flex',
        )}
      >
        {items.map((item) => {
          const off = hidden?.has(item.id) ?? false;

          return (
            <li
              key={item.id}
              className="flex h-7.5 items-center gap-1 text-xs whitespace-nowrap text-foreground print:h-5"
            >
              <span
                aria-hidden
                className={cn(
                  'size-4 shrink-0 rounded-full transition-opacity',
                  item.className,
                  off && 'opacity-30',
                )}
                style={item.style}
              />
              <span className={cn('flex-1 transition-opacity', off && 'opacity-50')}>
                {item.label}
              </span>
              {onToggle && (
                <button
                  type="button"
                  aria-label={`${off ? 'Mostrar' : 'Ocultar'} ${item.label}`}
                  aria-pressed={!off}
                  onClick={() => onToggle(item.id)}
                  className={cn(CONTROL_CLASS, 'ml-1 size-7.5')}
                >
                  {off ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
