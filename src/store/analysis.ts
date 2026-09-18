import { atom } from 'jotai';

import { EMPTY_ANALYSIS_FILTERS, type AnalysisFilterSelection } from '@/lib/analysis/filters';
import { selectableIndicators, toggleIndicatorId } from '@/lib/analysis/indicator-picker';
import type { Indicators } from '@/lib/api/metadata/schemas';
import type { FeatureId } from '@/lib/map/draw-features';
import { drawInstanceAtom, drawStateAtom } from '@/store/draw-core';

/**
 * The polygon picked for analysis — app-owned, unlike Terra Draw's edit selection,
 * which only lives while the edit tool is active. Picking a farm to analyse must not
 * require entering edit mode, where drags mutate geometry.
 *
 * `analysisId` itself lives in the draw reducer (`draw-state.ts`) so that deleting or
 * clearing a polygon prunes the selection in the same action that removes it. The
 * selection session's start and end (Analizar) live in `mode.ts`.
 */

export const selectAnalysisPolygonAtom = atom(null, (get, set, id: FeatureId) => {
  // A stale id — the polygon was deleted while the click was in flight — selects nothing.
  if (!get(drawStateAtom).polygons.some((polygon) => polygon.id === id)) return;

  const previous = get(drawStateAtom).analysisId;

  set(drawStateAtom, { type: 'analysisSelected', id });

  // The selection is mirrored onto the feature itself so Terra Draw's style functions
  // can paint it (`draw-styles.ts`): a property change is a feature change, which is
  // what makes Terra Draw repaint — no imperative restyle call needed.
  const draw = get(drawInstanceAtom);

  if (!draw?.enabled) return;

  if (previous !== null && previous !== id && draw.getSnapshotFeature(previous)) {
    draw.updateFeatureProperties(previous, { analysis: undefined });
  }

  draw.updateFeatureProperties(id, { analysis: true });
});

/** The parcel tab open on the analysis page — an index into the submitted area list. */
export const activeParcelTabAtom = atom(0);

/**
 * The hero dropdown selection, keyed by the API's filter id. One selection for the whole
 * analysis, not one per parcel tab: the tab index is clamped when the selection shrinks,
 * so a per-index record would silently attach one parcel's choices to another. Revisit
 * when parcels carry ids through the hero.
 *
 * Stored as the user's picks only (a missing id = untouched); defaults are derived at
 * read time from the filters query (`resolveFilterSelection`), so they follow the data.
 */
const analysisFiltersBaseAtom = atom<AnalysisFilterSelection>(EMPTY_ANALYSIS_FILTERS);

export const analysisFiltersAtom = atom((get) => get(analysisFiltersBaseAtom));

export const setAnalysisFilterAtom = atom(
  null,
  (get, set, update: { id: string; value: string }) => {
    set(analysisFiltersBaseAtom, { ...get(analysisFiltersBaseAtom), [update.id]: update.value });
  },
);

/**
 * Personalizar indicadores: the indicator ids the analysis page shows, or `null` while the
 * user has not touched the list (the API's `default` flags apply — `visibleIndicatorIds`).
 * One list for the whole analysis, like the filters above. Reads the list; writes toggle
 * one id, so the raw list is never set from a component.
 */
const selectedIndicatorIdsBaseAtom = atom<string[] | null>(null);

export const selectedIndicatorIdsAtom = atom(
  (get) => get(selectedIndicatorIdsBaseAtom),
  (get, set, update: { indicators: Indicators; id: string }) => {
    set(
      selectedIndicatorIdsBaseAtom,
      toggleIndicatorId(
        selectableIndicators(update.indicators),
        get(selectedIndicatorIdsBaseAtom),
        update.id,
      ),
    );
  },
);
