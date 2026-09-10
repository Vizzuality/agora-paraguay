/** The steps the selection panel walks through; step 3 is the /analisis page itself. */
export const SELECTION_STEPS = [
  { number: 1, label: 'Área\nde interés' },
  { number: 2, label: 'Confirmación\nde parcelas' },
  { number: 3, label: 'Análisis' },
] as const;

export type SelectionStep = (typeof SELECTION_STEPS)[number]['number'];

/** The steps the panel itself can show — step 3 lives on another route. */
export type PanelStep = Exclude<SelectionStep, 3>;

export type SelectionProgress = {
  /** Drawn or uploaded polygons plus clicked cadastral parcels. */
  areaCount: number;
  /** The draw tool is armed: a polygon is being traced right now. */
  drawing: boolean;
};

/** Which panel step the current selection state means. */
export function selectionStep(progress: SelectionProgress): PanelStep {
  if (!progress.drawing && progress.areaCount > 0) {
    return 2;
  }
  return 1;
}
