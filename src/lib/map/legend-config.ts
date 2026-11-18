/** Which controls a layer's rows get in the map legend. */
export type LegendConfig = {
  /** A slider that fades the layer. */
  opacity: boolean;
  /** An eye that hides and shows it. */
  visibility: boolean;
  /** A handle that moves it up and down the paint order. */
  order: boolean;
};

/** A key only: swatches and labels, no controls. */
export const LEGEND_KEY_ONLY: LegendConfig = { opacity: false, visibility: false, order: false };

/** Every control: fade, hide and reorder. */
export const LEGEND_ALL_CONTROLS: LegendConfig = { opacity: true, visibility: true, order: true };
