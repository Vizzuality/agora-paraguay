import { atom } from 'jotai';

import { importReplacingFeatures } from '@/lib/map/import-features';
import type { ParseOutcome, UploadResult } from '@/lib/upload/types';
import { selectAnalysisPolygonAtom } from '@/store/analysis';
import { drawInstanceAtom, drawStateAtom } from '@/store/draw-core';
import { backToSelectionAtom } from '@/store/mode';
import { selectedParcelsAtom } from '@/store/parcels';

/**
 * Uploaded areas of interest. Parsing lives in `src/lib/upload/`, the Terra Draw
 * mechanics of an import live in `src/lib/map/import-features.ts`; this file is only
 * the store side — coordinating state once a parse has succeeded, and what the UI
 * shows about the most recent attempt.
 */

/**
 * The outcome of the most recent upload, for the live region and the warning list.
 * Deliberately outside the reducer: it is ephemeral view state, not draw-domain state.
 */
export const uploadResultAtom = atom<UploadResult | null>(null);

/**
 * The shared start of a new selection session: drops the clicked cadastral parcels,
 * dismisses the previous upload notice, and returns the app to selection mode — an
 * upload or a fresh drawing after Analizar makes the map clickable again.
 * `startDrawAtom` and `uploadFeaturesAtom` both route through here. Lives in this file
 * because it owns `uploadResultAtom` (any other home would create an import cycle).
 */
export const resetSelectionSessionAtom = atom(null, (_get, set) => {
  set(uploadResultAtom, null);
  set(selectedParcelsAtom, []);
  set(backToSelectionAtom);
});

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

    // Disarm whatever tool is active before touching the store: stopping polygon mode
    // sweeps an in-progress ring, which the import's replace step cannot see — it only
    // holds finished polygons — and which must not stay armed over an import.
    set(drawStateAtom, { type: 'tool', tool: null });

    const outcome = importReplacingFeatures(draw, features);
    const allWarnings = [...warnings, ...outcome.rejectionWarnings];

    // Nothing landed: the map is untouched, so the previous polygons stay and the
    // outcome is an error, not a "with warnings" import of zero areas.
    if (outcome.accepted.length === 0) {
      set(uploadResultAtom, {
        fileName: upload.fileName,
        accepted: 0,
        warnings: allWarnings,
        error: `Ninguna área de "${upload.fileName}" pudo importarse.`,
        errorCode: null,
      });

      return;
    }

    // Like `clear()`, adding and removing features is not trusted to surface as a
    // `change` event — report the new geometry by hand. Idempotent if the event fires.
    set(drawStateAtom, { type: 'geometry', polygons: outcome.polygons });

    // Replace semantics extend to the clicked cadastral parcels: an upload starts the
    // selection over (and, after Analizar, returns the app to selection mode).
    set(resetSelectionSessionAtom);

    set(uploadResultAtom, {
      fileName: upload.fileName,
      accepted: outcome.accepted.length,
      warnings: allWarnings,
      error: null,
      errorCode: null,
    });

    // Auto-select the first polygon for analysis, so an upload is immediately usable.
    // Via the command atom, not a bare dispatch: it also mirrors the selection onto
    // the feature so Terra Draw paints it.
    set(selectAnalysisPolygonAtom, outcome.accepted[0].id);
  },
);
