import { createStore } from 'jotai';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MAX_WAIT_MS, RELAYOUT_MS, whenReportReady } from '@/lib/analysis/print-report';
import { reportMapAtom } from '@/store/report';

describe('whenReportReady', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('resolves a relayout after the map image lands', async () => {
    const store = createStore();
    let ready = false;
    void whenReportReady(store).then(() => (ready = true));

    store.set(reportMapAtom, 'data:image/png;base64,AAAA');
    await vi.advanceTimersByTimeAsync(RELAYOUT_MS - 1);
    expect(ready).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(ready).toBe(true);
  });

  it('gives up waiting for the map at the deadline', async () => {
    const store = createStore();
    let ready = false;
    void whenReportReady(store).then(() => (ready = true));

    await vi.advanceTimersByTimeAsync(MAX_WAIT_MS - 1);
    expect(ready).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(ready).toBe(true);
  });

  it('ignores the image being cleared', async () => {
    const store = createStore();
    store.set(reportMapAtom, 'stale');
    let ready = false;
    void whenReportReady(store).then(() => (ready = true));

    store.set(reportMapAtom, null);
    await vi.advanceTimersByTimeAsync(RELAYOUT_MS);
    expect(ready).toBe(false);
  });
});
