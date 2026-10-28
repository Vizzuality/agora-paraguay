import { useAtomValue, useSetAtom } from 'jotai';
import { Check } from 'lucide-react';

import { errorReason } from '@/lib/api/http';
import { useGetGlobalLayers } from '@/lib/map/use-get-global-layers';
import { cn } from '@/lib/utils';
import { activeGlobalLayerIdAtom, toggleGlobalLayerAtom } from '@/store/layers';

/**
 * The country-wide layers the API offers, under the selection panel. Each one switches
 * its layer on the map; one at a time. Reads atoms, so it renders inside `<ClientOnly>`.
 */
export function GlobalLayersList() {
  const { data: layers, error, isPending } = useGetGlobalLayers();
  const activeId = useAtomValue(activeGlobalLayerIdAtom);
  const toggle = useSetAtom(toggleGlobalLayerAtom);

  return (
    <section
      aria-labelledby="global-layers-heading"
      className="flex flex-col gap-2 px-2 pb-6 md:px-10"
    >
      <h2 id="global-layers-heading" className="text-base">
        Capas
      </h2>

      {isPending ? (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          Cargando capas…
        </p>
      ) : error ? (
        <p role="alert" className="text-sm text-destructive">
          No se pudieron cargar las capas: {errorReason(error)}
        </p>
      ) : layers.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin capas disponibles</p>
      ) : (
        // Rows bleed into the gutter so their text lines up with the heading.
        <ul className="-mx-2 flex flex-col gap-1 text-sm">
          {layers.map((layer) => {
            const active = layer.id === activeId;

            return (
              <li key={layer.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(layer.id)}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-accent hover:text-accent-foreground"
                >
                  <Check aria-hidden className={cn('size-4 shrink-0', !active && 'invisible')} />
                  {layer.name}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
