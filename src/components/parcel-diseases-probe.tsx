import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { parcelMutations } from '@/lib/api/parcels/queries';
import type { ParcelDiseasesRequest, ParcelDiseasesResponse } from '@/lib/api/parcels/schemas';

/**
 * TODO(diseases-probe): a hand-fired call to `POST /api/parcels/get-parcel-diseases/`
 * with a fixed body, to see the live contract from the UI. Remove once the endpoint is
 * wired into Analizar.
 */
const PROBE_REQUEST: ParcelDiseasesRequest = {
  parcel_ids: [8668],
  crop: 'soja',
  start_date: '2026-06-18',
  end_date: '2026-08-18',
};

export function ParcelDiseasesProbe() {
  const { mutate, data, error, isPending } = useMutation(parcelMutations.diseases());

  return (
    <section aria-labelledby="parcel-diseases-probe" className="flex flex-col gap-3 px-6 pb-6">
      <h2 id="parcel-diseases-probe" className="text-sm font-medium text-muted-foreground">
        Enfermedades por parcela
      </h2>

      <Button
        type="button"
        variant="secondary"
        className="self-start"
        disabled={isPending}
        onClick={() => mutate(PROBE_REQUEST)}
      >
        {isPending ? 'Consultando…' : 'Obtener enfermedades'}
      </Button>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      ) : null}

      {data ? <ParcelDiseasesTable response={data} /> : null}
    </section>
  );
}

/** One row per parcel column: what the API scored, as delivered. */
function ParcelDiseasesTable({ response }: { response: ParcelDiseasesResponse }) {
  if (response.features.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin parcelas en la respuesta.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left">
          <tr>
            <th className="px-3 py-2 font-medium">Parcela</th>
            <th className="px-3 py-2 font-medium">Campo</th>
            <th className="px-3 py-2 font-medium">Valor</th>
          </tr>
        </thead>
        <tbody>
          {response.features.flatMap((feature) =>
            Object.entries(feature.properties).map(([key, value]) => (
              <tr key={`${feature.properties.parcela_id}-${key}`} className="border-t">
                <td className="px-3 py-1.5 font-mono text-xs">{feature.properties.parcela_id}</td>
                <td className="px-3 py-1.5">{key}</td>
                <td className="px-3 py-1.5">{value === null ? '—' : String(value)}</td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}
