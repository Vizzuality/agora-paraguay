import { TriangleAlert } from 'lucide-react';

/**
 * Temporary: the map opens on Alto Paraná (`INITIAL_VIEW_STATE`) while the cadastre
 * covers that department only. Once coverage is national, remove it in the same change
 * that moves `INITIAL_VIEW_STATE` to the country-wide default (see its note).
 */
export function DevFocusBanner() {
  return (
    <p
      role="note"
      className="pointer-events-none absolute top-4 left-1/2 z-10 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-start gap-2 rounded-2xl bg-amber-400 px-4 py-2 text-sm font-medium text-amber-950 shadow-md"
    >
      <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>
        En desarrollo: el mapa se centra en Alto Paraná, la zona con datos. Con el catastro
        completo, se centrará en todo Paraguay.
      </span>
    </p>
  );
}
