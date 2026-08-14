import { useAtomValue, useSetAtom } from "jotai";
import { Eraser, MousePointer2, PenTool, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { clearDrawAtom, deleteSelectedAtom, drawAtom, setDrawToolAtom } from "@/lib/map/draw-atoms";
import { canClear, canDelete, canEdit } from "@/lib/map/draw-state";
import { cn } from "@/lib/utils";

/**
 * Draw, edit, delete and clear the areas of interest. A sibling of the map rather than a
 * child of it, because the state it reads is global rather than map-scoped.
 *
 * A `fieldset` and not a toolbar: a toolbar obliges roving tabindex, which buys nothing
 * for four controls that are all worth a tab stop, and the lint rules prefer the
 * semantic element over `role="group"`.
 */
export function DrawControls({ className }: { className?: string }) {
  const draw = useAtomValue(drawAtom);
  const setTool = useSetAtom(setDrawToolAtom);
  const deleteSelected = useSetAtom(deleteSelectedAtom);
  const clear = useSetAtom(clearDrawAtom);

  return (
    <fieldset
      className={cn(
        "absolute top-4 right-16 z-10 flex items-center gap-1 rounded-lg bg-background/95 p-1 shadow-lg backdrop-blur",
        className,
      )}
    >
      <legend className="sr-only">Drawing tools</legend>

      <Toggle
        pressed={draw.tool === "draw"}
        onPressedChange={(pressed) => setTool(pressed ? "draw" : null)}
        disabled={!draw.bound}
        aria-label="Draw an area"
        title="Draw an area"
      >
        <PenTool />
      </Toggle>

      <Toggle
        pressed={draw.tool === "edit"}
        onPressedChange={(pressed) => setTool(pressed ? "edit" : null)}
        disabled={!canEdit(draw)}
        aria-label="Select and edit areas"
        title="Select and edit areas"
      >
        <MousePointer2 />
      </Toggle>

      <div aria-hidden className="mx-0.5 h-5 w-px bg-border" />

      <Button
        variant="ghost"
        size="icon"
        onClick={deleteSelected}
        disabled={!canDelete(draw)}
        aria-label="Delete the selected area"
        title="Delete the selected area"
      >
        <Trash2 />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={clear}
        disabled={!canClear(draw)}
        aria-label="Delete all areas"
        title="Delete all areas"
      >
        <Eraser />
      </Button>

      {/* Disabled buttons take no focus, so without this a screen reader user has no way
          to tell why the cluster is inert, or that a drawing landed. */}
      <p aria-live="polite" className="sr-only">
        {draw.polygons.length === 0
          ? "No areas drawn."
          : `${draw.polygons.length} ${draw.polygons.length === 1 ? "area" : "areas"} drawn.`}
      </p>
    </fieldset>
  );
}
