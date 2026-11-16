import { HeroFilters } from '@/components/analysis-hero';
import { IndicatorPicker } from '@/components/indicator-picker';
import { filterSummary } from '@/lib/analysis/filters';
import { useHeroFilters } from '@/lib/analysis/use-hero-filters';
import type { Riesgo } from '@/lib/api/metadata/schemas';

/** The closed heading's line: the filters in force, once they have loaded. */
export function useCropDatesLabel(riesgo: Riesgo): string | undefined {
  const {
    filters: { data: filters },
    resolvedFilters,
  } = useHeroFilters(riesgo);

  return filters && resolvedFilters ? filterSummary(filters, resolvedFilters) : undefined;
}

/**
 * Cultivo y fechas: the analysis filters the riesgo offers (`GET /api/parcels/filters/`),
 * the hero's fields in the sidebar. Changing one re-runs the analysis. Reads atoms:
 * render inside `<ClientOnly>`.
 */
export function CropDatesSetting({ riesgo }: Readonly<{ riesgo: Riesgo }>) {
  return (
    <>
      <HeroFilters riesgo={riesgo} />
      {/* Productivo keeps it in the content column, beside Exportar informe. */}
      {riesgo === 'sanitario' && (
        <IndicatorPicker riesgo={riesgo} className="h-12 w-full border text-primary" />
      )}
    </>
  );
}
