import { useAtomValue, useSetAtom } from 'jotai';
import { Eraser, MousePointer2, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { canClear, canDelete, canEdit } from '@/lib/map/draw-state';
import { cn } from '@/lib/utils';
import { clearDrawAtom, deleteSelectedAtom, drawAtom, setDrawToolAtom } from '@/store/draw';

/**
 * Edit, delete and clear the areas of interest already on the map. Editing is spatial
 * work, so it stays anchored to the map; starting a session — drawing or uploading —
 * lives in the panel (`AreaActions`). A sibling of the map rather than a child of it,
 * because the state it reads is global rather than map-scoped.
 *
 * A `fieldset` and not a toolbar: a toolbar obliges roving tabindex, which buys nothing
 * for three controls that are all worth a tab stop, and the lint rules prefer the
 * semantic element over `role="group"`.
 */
export function DrawControls({ className }: Readonly<{ className?: string }>) {
  const draw = useAtomValue(drawAtom);
  const setTool = useSetAtom(setDrawToolAtom);
  const deleteSelected = useSetAtom(deleteSelectedAtom);
  const clear = useSetAtom(clearDrawAtom);

  return (
    <fieldset
      className={cn(
        'absolute top-4 right-16 z-10 flex items-center gap-1 rounded-lg bg-background/95 p-1 shadow-lg backdrop-blur',
        className,
      )}
    >
      <legend className="sr-only">Herramientas de dibujo</legend>

      <Toggle
        pressed={draw.tool === 'edit'}
        onPressedChange={(pressed) => setTool(pressed ? 'edit' : null)}
        disabled={!canEdit(draw)}
        aria-label="Seleccionar y editar áreas"
        title="Seleccionar y editar áreas"
      >
        <MousePointer2 />
      </Toggle>

      <div aria-hidden className="mx-0.5 h-5 w-px bg-border" />

      <Button
        variant="ghost"
        size="icon"
        onClick={deleteSelected}
        disabled={!canDelete(draw)}
        aria-label="Eliminar el área seleccionada"
        title="Eliminar el área seleccionada"
      >
        <Trash2 />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={clear}
        disabled={!canClear(draw)}
        aria-label="Eliminar todas las áreas"
        title="Eliminar todas las áreas"
      >
        <Eraser />
      </Button>

      {/* Disabled buttons take no focus, so without this a screen reader user has no way
          to tell why the cluster is inert, or that a drawing landed. */}
      <p aria-live="polite" className="sr-only">
        {drawnStatus(draw.polygons.length)}
      </p>
    </fieldset>
  );
}

function drawnStatus(count: number): string {
  if (count === 0) return 'No hay áreas dibujadas.';

  return count === 1 ? '1 área dibujada.' : `${count} áreas dibujadas.`;
}
