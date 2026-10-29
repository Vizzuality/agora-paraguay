import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';

import { bindDrawAtom, drawAtom, redrawAfterRejectionAtom } from '@/store/draw';
import { areaRejectionAtom, type AreaRejection } from '@/store/selection';

import { startedDraw } from '../lib/map/headless-draw';

function boundStore(rejection: AreaRejection | null) {
  const store = createStore();
  const draw = startedDraw();

  store.set(bindDrawAtom, draw);
  store.set(areaRejectionAtom, rejection);

  return { store, draw };
}

describe('redrawAfterRejectionAtom', () => {
  it('after a rejected drawing, dismisses the error and arms the polygon tool at once', () => {
    const { store, draw } = boundStore({ source: 'draw', message: 'Fuera de cobertura' });

    store.set(redrawAfterRejectionAtom);

    expect(store.get(areaRejectionAtom)).toBeNull();
    expect(store.get(drawAtom).tool).toBe('draw');
    // Set here, not left to the mode effect: the click that fired this must reach
    // Terra Draw in polygon mode to become the first vertex.
    expect(draw.getMode()).toBe('polygon');
  });

  it('leaves a rejected upload alone: its error keeps its own dismissals', () => {
    const rejection: AreaRejection = { source: 'upload', message: 'Fuera de cobertura' };
    const { store, draw } = boundStore(rejection);

    store.set(redrawAfterRejectionAtom);

    expect(store.get(areaRejectionAtom)).toEqual(rejection);
    expect(store.get(drawAtom).tool).toBeNull();
    expect(draw.getMode()).toBe('static');
  });

  it('does nothing without a showing error', () => {
    const { store, draw } = boundStore(null);

    store.set(redrawAfterRejectionAtom);

    expect(store.get(drawAtom).tool).toBeNull();
    expect(draw.getMode()).toBe('static');
  });
});
