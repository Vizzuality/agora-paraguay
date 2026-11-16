import { Blend, Eye, EyeOff, GripVertical } from 'lucide-react';
import { type CSSProperties, type KeyboardEvent, useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { moveItem } from '@/lib/map/legend-order';
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
  /** With it, each row gets a drag handle; called with the ids in their new order. */
  onReorder?: (ids: string[]) => void;
  /** Each row's opacity, 0–1 (1 when absent); with `onOpacity`, each row gets a slider. */
  opacity?: Readonly<Record<string, number>>;
  onOpacity?: (id: string, value: number) => void;
};

const CONTROL_CLASS =
  'flex shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';

/**
 * A map's key, bottom left: Mostrar/Ocultar leyenda over the swatches on a light panel,
 * open until folded. Every map's legend uses it, so they read and fold alike. A map that
 * lets its rows be faded, hidden or reordered passes the handlers, and the rows grow an
 * opacity slider, an eye and a drag handle: drag it along the handles, or move the row
 * with the arrow keys.
 */
export function MapLegend({
  label,
  items,
  className,
  hidden,
  onToggle,
  onReorder,
  opacity,
  onOpacity,
}: Readonly<MapLegendProps>) {
  const [open, setOpen] = useState(true);
  const [dragged, setDragged] = useState<number | null>(null);
  const id = useId();
  const ids = items.map((item) => item.id);

  const move = (from: number, to: number) => onReorder?.(moveItem(ids, from, to));

  const onHandleKey = (index: number) => (event: KeyboardEvent) => {
    const step = { ArrowUp: -1, ArrowDown: 1 }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    move(index, index + step);
  };

  return (
    <div className={cn('absolute z-10 flex min-w-52 flex-col items-start gap-1', className)}>
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
          aria-label={label}
          className="flex w-full flex-col gap-1 rounded-2xl bg-background py-2 pr-2 pl-4 backdrop-blur-xs"
        >
          {items.map((item, index) => {
            const off = hidden?.has(item.id) ?? false;

            return (
              <li
                key={item.id}
                className={cn(
                  'flex h-7.5 items-center gap-1 text-xs whitespace-nowrap text-foreground',
                  dragged === index && 'opacity-50',
                )}
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
                {(onToggle || onReorder || onOpacity) && (
                  <span aria-hidden className="w-1 shrink-0" />
                )}
                {onOpacity && (
                  <OpacityControl
                    label={item.label}
                    value={opacity?.[item.id] ?? 1}
                    onChange={(value) => onOpacity(item.id, value)}
                  />
                )}
                {onToggle && (
                  <button
                    type="button"
                    aria-label={`${off ? 'Mostrar' : 'Ocultar'} ${item.label}`}
                    aria-pressed={!off}
                    onClick={() => onToggle(item.id)}
                    className={cn(CONTROL_CLASS, 'size-7.5')}
                  >
                    {off ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                )}
                {onReorder && (
                  <button
                    type="button"
                    aria-label={`Reordenar ${item.label}`}
                    title="Arrastrar, o flechas arriba y abajo"
                    onKeyDown={onHandleKey(index)}
                    draggable
                    onDragStart={(event) => {
                      const row = event.currentTarget.closest('li');
                      if (row) event.dataTransfer.setDragImage(row, 0, row.offsetHeight / 2);
                      event.dataTransfer.effectAllowed = 'move';
                      setDragged(index);
                    }}
                    onDragOver={(event) => {
                      if (dragged === null) return;
                      event.preventDefault();
                      if (dragged !== index) {
                        move(dragged, index);
                        setDragged(index);
                      }
                    }}
                    onDragEnd={() => setDragged(null)}
                    className={cn(CONTROL_CLASS, 'size-6 cursor-grab active:cursor-grabbing')}
                  >
                    <GripVertical className="size-5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** A row's opacity: its button opens a slider, 0–100 % in steps of 5. */
function OpacityControl({
  label,
  value,
  onChange,
}: Readonly<{ label: string; value: number; onChange: (value: number) => void }>) {
  const percent = Math.round(value * 100);

  return (
    <Popover>
      <PopoverTrigger
        aria-label={`Opacidad de ${label}: ${percent} %`}
        className={cn(CONTROL_CLASS, 'size-7.5')}
      >
        <Blend className="size-5" />
      </PopoverTrigger>
      <PopoverContent side="top" className="flex w-56 flex-col gap-3 rounded-2xl p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Opacidad</span>
          <span className="tabular-nums">{percent} %</span>
        </div>
        <Slider
          aria-label={`Opacidad de ${label}`}
          min={0}
          max={100}
          step={5}
          value={[percent]}
          onValueChange={([next]) => onChange(next / 100)}
        />
      </PopoverContent>
    </Popover>
  );
}
