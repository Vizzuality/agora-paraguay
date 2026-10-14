/**
 * Temporary: the map opens on Alto Paraná (`INITIAL_VIEW_STATE`) while the cadastre
 * covers that department only. Remove with the view state when coverage is national.
 */
export function DevFocusBanner() {
  return (
    <p
      role="note"
      className="pointer-events-none absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs whitespace-nowrap text-white backdrop-blur-xs"
    >
      Mapa centrado en Alto Paraná durante el desarrollo.
    </p>
  );
}
