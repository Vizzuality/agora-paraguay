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
  /** Drawn or uploaded polygons. */
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

/** What a phone shows: the panel, or the map with a bar of actions under it. */
export type SelectionView = 'selection' | 'map';

/**
 * A narrow screen cannot hold the panel beside the map, so they take turns: the panel
 * while the user picks how to bring an area in (Figma mobile01), the map as soon as a
 * polygon is being traced (mobile02) or areas have landed (mobile03, step 2). Wide
 * screens show both and never ask.
 */
export function selectionView(progress: SelectionProgress): SelectionView {
  return progress.drawing || progress.areaCount > 0 ? 'map' : 'selection';
}
