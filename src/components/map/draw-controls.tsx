import { useAtomValue, useSetAtom } from "jotai";
import { Eraser, MousePointer2, PenTool, Trash2, X } from "lucide-react";

import { UploadControl } from "@/components/map/upload-control";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { canClear, canDelete, canEdit } from "@/lib/map/draw-state";
import type { UploadResult } from "@/lib/upload/types";
import { cn } from "@/lib/utils";
import { clearDrawAtom, deleteSelectedAtom, drawAtom, setDrawToolAtom } from "@/store/draw";
import { uploadResultAtom } from "@/store/upload";

/** How many upload warnings are shown before collapsing into "and N more". */
const MAX_VISIBLE_WARNINGS = 5;

/**
 * Draw, edit, upload, delete and clear the areas of interest. A sibling of the map
 * rather than a child of it, because the state it reads is global rather than
 * map-scoped.
 *
 * A `fieldset` and not a toolbar: a toolbar obliges roving tabindex, which buys nothing
 * for five controls that are all worth a tab stop, and the lint rules prefer the
 * semantic element over `role="group"`.
 */
export function DrawControls({ className }: Readonly<{ className?: string }>) {
  const draw = useAtomValue(drawAtom);
  const uploadResult = useAtomValue(uploadResultAtom);
  const setTool = useSetAtom(setDrawToolAtom);
  const deleteSelected = useSetAtom(deleteSelectedAtom);
  const clear = useSetAtom(clearDrawAtom);

  return (
    <>
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

        <UploadControl />

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
            to tell why the cluster is inert, or that a drawing or an upload landed. */}
        <p aria-live="polite" className="sr-only">
          {drawnStatus(draw.polygons.length)}
          {uploadResult !== null && ` ${uploadStatus(uploadResult)}`}
        </p>
      </fieldset>

      <UploadNotices />
    </>
  );
}

function drawnStatus(count: number): string {
  if (count === 0) return "No areas drawn.";

  return `${count} ${count === 1 ? "area" : "areas"} drawn.`;
}

function uploadStatus(result: UploadResult): string {
  if (result.error !== null) return `Upload failed: ${result.error}`;

  return `Imported ${result.accepted} ${result.accepted === 1 ? "area" : "areas"} from ${result.fileName}.`;
}

/** The visible counterpart of the live region: upload errors and per-polygon warnings. */
function UploadNotices() {
  const uploadResult = useAtomValue(uploadResultAtom);
  const setUploadResult = useSetAtom(uploadResultAtom);

  if (uploadResult === null) return null;
  if (uploadResult.error === null && uploadResult.warnings.length === 0) return null;

  const visible = uploadResult.warnings.slice(0, MAX_VISIBLE_WARNINGS);
  const hidden = uploadResult.warnings.length - visible.length;

  return (
    <section
      aria-label="Upload notices"
      className="absolute top-16 right-16 z-10 flex w-80 flex-col gap-1 rounded-lg bg-background/95 p-3 text-sm shadow-lg backdrop-blur"
    >
      <header className="flex items-start justify-between gap-2">
        <p className={cn("font-medium", uploadResult.error !== null && "text-destructive")}>
          {uploadResult.error ?? `Imported from ${uploadResult.fileName} with warnings:`}
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="-mt-1 -mr-1 size-6 shrink-0"
          onClick={() => setUploadResult(null)}
          aria-label="Dismiss upload notices"
        >
          <X />
        </Button>
      </header>

      {visible.length > 0 && (
        <ul className="flex list-disc flex-col gap-1 pl-4 text-muted-foreground">
          {visible.map((warning) => (
            <li key={warning.message}>{warning.message}</li>
          ))}
          {hidden > 0 && <li>and {hidden} more.</li>}
        </ul>
      )}
    </section>
  );
}
