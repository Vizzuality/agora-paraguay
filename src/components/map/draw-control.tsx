import { useState } from "react";

import { Toggle } from "@/components/ui/toggle";
import { useTerraDraw } from "@/lib/map/use-terra-draw";

/**
 * Temporary control proving the Terra Draw / MapLibre pairing works. It is not the
 * drawing UI — that arrives with the real geometry requirements.
 */
export function DrawControl() {
  const [drawing, setDrawing] = useState(false);

  useTerraDraw(drawing ? "polygon" : "select");

  return (
    <div className="absolute top-4 right-16 z-10">
      <Toggle
        pressed={drawing}
        onPressedChange={setDrawing}
        aria-label="Draw a polygon"
        className="bg-background shadow-sm"
      >
        Draw
      </Toggle>
    </div>
  );
}
