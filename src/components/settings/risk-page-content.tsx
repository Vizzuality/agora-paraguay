import { useAtomValue } from 'jotai';

import { MapView } from '@/components/map';
import { ParcelsLookup } from '@/components/map/parcels-lookup';
import { analysedViewAtom } from '@/store/mode';

/**
 * A riesgo's content column: the selection map until Analizar, then the analysis (its
 * own ticket per riesgo). Reads atoms: render inside `<ClientOnly>`.
 */
export function RiskPageContent({ title }: Readonly<{ title: string }>) {
  const analysed = useAtomValue(analysedViewAtom);

  return (
    <>
      <h1 className="sr-only">{title}</h1>
      {!analysed && (
        // The window's height less the column's padding, so the whole map is in view.
        <div className="relative h-[calc(100dvh-5rem)] min-h-96 overflow-hidden rounded-3xl bg-muted">
          <MapView />
          <ParcelsLookup />
        </div>
      )}
    </>
  );
}
