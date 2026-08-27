import { TerraDraw, TerraDrawExtend, TerraDrawPolygonMode, TerraDrawSelectMode } from 'terra-draw';

/**
 * An adapter that satisfies Terra Draw without a map or a DOM, so store and import
 * behaviour can be pinned in node. `register`/`unregister` are overridden because the
 * base implementations attach real DOM listeners.
 */
export class HeadlessAdapter extends TerraDrawExtend.TerraDrawBaseAdapter {
  constructor() {
    super({ coordinatePrecision: 9 });
  }

  getMapEventElement(): HTMLElement {
    return undefined as unknown as HTMLElement;
  }

  override register(): void {}

  override unregister(): void {}

  clear(): void {}

  project(): { x: number; y: number } {
    return { x: 0, y: 0 };
  }

  unproject(): { lng: number; lat: number } {
    return { lng: 0, lat: 0 };
  }

  setCursor(): void {}

  getLngLatFromEvent(): { lng: number; lat: number } | null {
    return null;
  }

  setDraggability(): void {}

  setDoubleClickToZoom(): void {}

  render(): void {}
}

/** A started headless instance with the same modes the app registers. */
export function startedDraw(): TerraDraw {
  const draw = new TerraDraw({
    adapter: new HeadlessAdapter(),
    modes: [new TerraDrawPolygonMode(), new TerraDrawSelectMode()],
  });

  draw.start();

  return draw;
}
