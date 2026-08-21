import { atom } from "jotai";

import { drawnPolygons } from "@/lib/map/draw-features";
import type { ParseOutcome, UploadResult } from "@/lib/upload/types";
import { drawInstanceAtom, drawStateAtom } from "@/store/draw-core";

/**
 * Uploaded areas of interest. Parsing lives in `src/lib/upload/`; this file is only the
 * store side — what happens once a parse has succeeded, and what the UI shows about the
 * most recent attempt.
 */

/**
 * The outcome of the most recent upload, for the live region and the warning list.
 * Deliberately outside the reducer: it is ephemeral view state, not draw-domain state.
 */
export const uploadResultAtom = atom<UploadResult | null>(null);

/**
 * Injects a parsed upload into the store. Replace semantics: everything on the map goes
 * — the previous upload AND the hand-drawn polygons — and only once the new parse has
 * succeeded, so a failed upload never costs the polygons already on the map.
 */
export const uploadFeaturesAtom = atom(
  null,
  (get, set, upload: { fileName: string; outcome: ParseOutcome }) => {
    const draw = get(drawInstanceAtom);

    if (!draw?.enabled) return;

    const { features, warnings } = upload.outcome;

    const previousIds = drawnPolygons(draw.getSnapshot()).map((polygon) => polygon.id);

    // Deselect first, mirroring `deleteSelectedAtom`: selection points must not outlive
    // the geometry they annotate.
    const { selectedId } = get(drawStateAtom);

    if (selectedId !== null && previousIds.includes(selectedId)) {
      draw.deselectFeature(selectedId);
      set(drawStateAtom, { type: "deselected", id: selectedId });
    }

    if (previousIds.length > 0) {
      draw.removeFeatures(previousIds);
    }

    // The store validates each feature on its own: valid ones land, invalid ones come
    // back with a reason and become warnings rather than failing the upload.
    const validations = draw.addFeatures(features);
    const rejectedIds = new Set(
      validations.filter((validation) => !validation.valid).map((validation) => validation.id),
    );

    const rejectionWarnings = features
      .filter((feature) => rejectedIds.has(feature.id))
      .map((feature) => {
        const reason = validations.find((validation) => validation.id === feature.id)?.reason;

        return {
          featureName: feature.properties.name,
          // Terra Draw's `reason` is library text and stays in English.
          message: `"${feature.properties.name}" fue rechazado: ${reason ?? "geometría inválida"}.`,
        };
      });

    // Like `clear()`, adding and removing features is not trusted to surface as a
    // `change` event — report the new geometry by hand. Idempotent if the event fires.
    set(drawStateAtom, { type: "geometry", polygons: drawnPolygons(draw.getSnapshot()) });

    const accepted = features.filter((feature) => !rejectedIds.has(feature.id));

    set(uploadResultAtom, {
      fileName: upload.fileName,
      accepted: accepted.length,
      warnings: [...warnings, ...rejectionWarnings],
      error: null,
    });

    // Auto-select the first polygon for analysis, so an upload is immediately usable.
    if (accepted.length > 0) {
      set(drawStateAtom, { type: "analysisSelected", id: accepted[0].id });
    }
  },
);
