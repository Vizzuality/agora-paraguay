import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';

import { dismissAnalysisInfoAtom, dismissedAnalysisInfoAtom } from '@/store/analysis-info';

describe('dismissAnalysisInfoAtom', () => {
  it('closes one type at a time, leaving the others open', () => {
    const store = createStore();

    store.set(dismissAnalysisInfoAtom, 'Riesgo sanitario');

    expect(store.get(dismissedAnalysisInfoAtom)).toEqual(['Riesgo sanitario']);
  });

  it('records a type once however often it is closed', () => {
    const store = createStore();

    store.set(dismissAnalysisInfoAtom, 'Exposición climática');
    store.set(dismissAnalysisInfoAtom, 'Exposición climática');

    expect(store.get(dismissedAnalysisInfoAtom)).toEqual(['Exposición climática']);
  });
});
