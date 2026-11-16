import { describe, expect, it } from 'vitest';

import { collapseAttribution } from '@/lib/map/attribution';

/** The control's classes and the map's data listeners, without a DOM. */
function fakeMap(initial: string[]) {
  const classes = new Set(initial);
  const listeners = new Map<string, Set<() => void>>();
  const control = {
    classList: {
      contains: (name: string) => classes.has(name),
      remove: (name: string) => classes.delete(name),
    },
  };
  const map = {
    on: (type: string, listener: () => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(listener);
    },
    off: (type: string, listener: () => void) => listeners.get(type)?.delete(listener),
  };
  const fire = (type: string) => listeners.get(type)?.forEach((listener) => listener());
  const listening = () => [...listeners.values()].reduce((sum, set) => sum + set.size, 0);

  return { map: map as never, control: control as never, classes, fire, listening };
}

describe('collapseAttribution', () => {
  it('closes credits that are already open', () => {
    const { map, control, classes, listening } = fakeMap([
      'maplibregl-compact',
      'maplibregl-compact-show',
    ]);

    collapseAttribution(map, control);

    expect(classes.has('maplibregl-compact-show')).toBe(false);
    expect(listening()).toBe(0);
  });

  it('closes credits that open later, when a source brings them', () => {
    const { map, control, classes, fire, listening } = fakeMap([]);

    collapseAttribution(map, control);
    classes.add('maplibregl-compact');
    classes.add('maplibregl-compact-show');
    fire('sourcedata');

    expect(classes.has('maplibregl-compact-show')).toBe(false);
    expect(listening()).toBe(0);
  });

  it('leaves credits the user opened afterwards alone', () => {
    const { map, control, classes, fire } = fakeMap(['maplibregl-compact']);

    collapseAttribution(map, control);
    classes.add('maplibregl-compact-show');
    fire('sourcedata');

    expect(classes.has('maplibregl-compact-show')).toBe(true);
  });
});
