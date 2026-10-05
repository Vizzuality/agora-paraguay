import { describe, expect, it } from 'vitest';

import { scrollEdges, verticalScrollEdges } from '@/lib/scroll-edges';

describe('scrollEdges', () => {
  it('is at both edges when everything fits', () => {
    expect(scrollEdges(0, 300, 200)).toEqual({ atStart: true, atEnd: true });
    expect(scrollEdges(0, 300, 300)).toEqual({ atStart: true, atEnd: true });
  });

  it('reports the start, the middle and the end of an overflowing list', () => {
    expect(scrollEdges(0, 300, 900)).toEqual({ atStart: true, atEnd: false });
    expect(scrollEdges(250, 300, 900)).toEqual({ atStart: false, atEnd: false });
    expect(scrollEdges(600, 300, 900)).toEqual({ atStart: false, atEnd: true });
  });

  it('tolerates a sub-pixel shortfall at the end', () => {
    expect(scrollEdges(599.5, 300, 900).atEnd).toBe(true);
    expect(scrollEdges(598, 300, 900).atEnd).toBe(false);
  });
});

describe('verticalScrollEdges', () => {
  it('reads the vertical metrics of a scroller', () => {
    expect(verticalScrollEdges({ scrollTop: 40, clientHeight: 320, scrollHeight: 500 })).toEqual({
      atStart: false,
      atEnd: false,
    });
  });
});
