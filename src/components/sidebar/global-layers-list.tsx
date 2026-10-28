import { errorReason } from '@/lib/api/http';
import { useGetGlobalLayers } from '@/lib/map/use-get-global-layers';

/** The country-wide layers the API offers, listed by name under the selection panel. */
export function GlobalLayersList() {
  const { data: layers, error, isPending } = useGetGlobalLayers();

  return (
    <section aria-labelledby="global-layers-heading" className="flex flex-col gap-2 px-6 pb-6">
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
        <ul className="flex flex-col gap-1 text-sm">
          {layers.map((layer) => (
            <li key={layer.id}>{layer.name}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
