import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { useCurrentAnalysisType } from '@/components/settings/analysis-type-setting';
import { reportParameters } from '@/lib/analysis/report';
import { useHeroFilters } from '@/lib/analysis/use-hero-filters';
import type { Riesgo } from '@/lib/api/metadata/schemas';
import { parcelQueries } from '@/lib/api/parcels/queries';
import { geometryHectares } from '@/lib/map/polygon-area';
import { activeParcelIdAtom, analysedParcelIdsAtom } from '@/store/analysis';
import { drawPolygonsAtom } from '@/store/draw';
import { reportMapAtom } from '@/store/report';

/**
 * The report's Parámetros del análisis, on paper only, in place of the settings column:
 * the área's map snapshot beside the filters in force and the hectares analysed.
 * Reads atoms: render inside `<ClientOnly>`.
 */
export function ReportParameters() {
  const riesgo = useCurrentAnalysisType()?.riesgo;

  return riesgo ? <Parameters riesgo={riesgo} /> : null;
}

function Parameters({ riesgo }: Readonly<{ riesgo: Riesgo }>) {
  const snapshot = useAtomValue(reportMapAtom);
  const {
    filters: { data: filters },
    resolvedFilters,
  } = useHeroFilters(riesgo);
  const hectares = useReportedHectares();
  const rows =
    filters && resolvedFilters ? reportParameters(filters, resolvedFilters, hectares) : [];

  return (
    <section
      aria-label="Parámetros del análisis"
      className="hidden break-inside-avoid gap-6 rounded-3xl border-2 border-border p-6 print:flex"
    >
      {/* The map's paper width (`paper:w-82` in `AreaSetting`): the snapshot prints at the size
          it was taken, never stretched past its pixels by a short list beside it. */}
      <div className="relative min-h-60 w-82 flex-none overflow-hidden rounded-md bg-muted">
        {snapshot && (
          <img src={snapshot} alt="" className="absolute inset-0 size-full object-cover" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4">
        <h2 className="text-base leading-[20.3px] tracking-[0.28px] text-foreground">
          Parámetros del análisis
        </h2>
        <dl className="flex flex-col gap-4">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** The hectares the report is about: the open tab's parcel, or every analysed one under Todas. */
function useReportedHectares(): number | null {
  const areas = useAtomValue(drawPolygonsAtom);
  const analysedIds = useAtomValue(analysedParcelIdsAtom);
  const activeId = useAtomValue(activeParcelIdAtom);
  const { data: parcels } = useQuery(parcelQueries.filtered(areas));

  if (!parcels) return null;

  const reported = activeId === null ? analysedIds : [activeId];

  return parcels.results
    .filter((parcel) => reported.includes(parcel.parcel_id))
    .flatMap((parcel) => parcel.geometry.features)
    .reduce((total, feature) => total + geometryHectares(feature.geometry), 0);
}
