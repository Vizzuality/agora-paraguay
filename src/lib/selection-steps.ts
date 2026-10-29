import type { Riesgo } from '@/lib/api/metadata/schemas';

/** The steps the selection panel walks through. */
export const SELECTION_STEPS = [
  { number: 1, label: 'Tipo\nde análisis' },
  { number: 2, label: 'Área\nde interés' },
  { number: 3, label: 'Confirmación\nde parcelas' },
] as const;

export type SelectionStep = (typeof SELECTION_STEPS)[number]['number'];

export type SelectionProgress = {
  /** The riesgo picked on step 1; Exposición climática leaves the page instead. */
  analysisType: Riesgo | null;
  /** Drawn or uploaded polygons. */
  areaCount: number;
  /** The draw tool is armed: a polygon is being traced right now. */
  drawing: boolean;
};

/**
 * Which panel step the current selection state means. Areas win over a missing type:
 * a reload restores the areas but not the type, and must still land on confirmation.
 */
export function selectionStep(progress: SelectionProgress): SelectionStep {
  if (!progress.drawing && progress.areaCount > 0) return 3;
  if (progress.analysisType == null) return 1;
  return 2;
}

/** What a phone shows: the panel, or the map with a bar of actions under it. */
export type SelectionView = 'selection' | 'map';

/**
 * A narrow screen cannot hold the panel beside the map, so they take turns: the panel
 * while the user picks the analysis and how to bring an area in, the map as soon as a
 * polygon is being traced or areas have landed (step 3), where the parcels the API
 * answered are picked by tapping. Wide screens show both and never ask.
 */
export function selectionView(
  progress: Pick<SelectionProgress, 'areaCount' | 'drawing'>,
): SelectionView {
  return progress.drawing || progress.areaCount > 0 ? 'map' : 'selection';
}
