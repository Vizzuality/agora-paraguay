import { describe, expect, it } from 'vitest';

import { nextScrollLeft, scrollEdges, scrollLeftForTab } from '@/lib/analysis/parcel-tabs-scroll';

// A strip showing 300px of 1000px of tabs.
const STRIP = { clientWidth: 300, scrollWidth: 1000 };

describe('scrollLeftForTab', () => {
  it('brings a tab past the right edge to the leading edge, after the gutter', () => {
    expect(scrollLeftForTab(516, STRIP, 16)).toBe(500);
  });

  it('brings a tab before the current scroll back to the leading edge too', () => {
    // Where the strip currently is does not matter: the target is absolute.
    expect(scrollLeftForTab(116, STRIP, 16)).toBe(100);
  });

  it('never scrolls before the start', () => {
    expect(scrollLeftForTab(16, STRIP, 16)).toBe(0);
    expect(scrollLeftForTab(4, STRIP, 16)).toBe(0);
  });

  it('stops at the end when the tab is in the last stretch', () => {
    // Content ends at 1000; the last 300px are visible from 700 on.
    expect(scrollLeftForTab(900, STRIP, 16)).toBe(700);
  });

  it('is zero when everything already fits', () => {
    expect(scrollLeftForTab(200, { clientWidth: 500, scrollWidth: 400 }, 16)).toBe(0);
  });

  it('defaults to no gutter', () => {
    expect(scrollLeftForTab(250, STRIP)).toBe(250);
  });
});

describe('nextScrollLeft', () => {
  it('moves 80% of the visible width in the pressed direction', () => {
    expect(nextScrollLeft({ scrollLeft: 0, ...STRIP }, 'right')).toBe(240);
    expect(nextScrollLeft({ scrollLeft: 500, ...STRIP }, 'left')).toBe(260);
  });

  it('clamps to the scrollable range', () => {
    expect(nextScrollLeft({ scrollLeft: 100, ...STRIP }, 'left')).toBe(0);
    expect(nextScrollLeft({ scrollLeft: 600, ...STRIP }, 'right')).toBe(700);
  });
});

describe('scrollEdges', () => {
  it('reports both edges when nothing overflows', () => {
    expect(scrollEdges({ scrollLeft: 0, clientWidth: 500, scrollWidth: 400 })).toEqual({
      atStart: true,
      atEnd: true,
    });
  });

  it('reports the start, the middle and the end', () => {
    expect(scrollEdges({ scrollLeft: 0, ...STRIP })).toEqual({ atStart: true, atEnd: false });
    expect(scrollEdges({ scrollLeft: 350, ...STRIP })).toEqual({ atStart: false, atEnd: false });
    expect(scrollEdges({ scrollLeft: 700, ...STRIP })).toEqual({ atStart: false, atEnd: true });
  });

  it('tolerates a sub-pixel shortfall at the end', () => {
    expect(scrollEdges({ scrollLeft: 699.4, ...STRIP }).atEnd).toBe(true);
  });
});
