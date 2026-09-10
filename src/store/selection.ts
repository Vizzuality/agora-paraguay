import { atom } from 'jotai';

import { selectionStep } from '@/lib/selection-steps';
import { drawStateAtom } from '@/store/draw-core';
import { selectedParcelsAtom } from '@/store/parcels';

/** The panel step, derived: the store never holds it, so it cannot drift from the areas. */
export const selectionStepAtom = atom((get) => {
  const draw = get(drawStateAtom);

  return selectionStep({
    areaCount: draw.polygons.length + get(selectedParcelsAtom).length,
    drawing: draw.tool === 'draw',
  });
});
