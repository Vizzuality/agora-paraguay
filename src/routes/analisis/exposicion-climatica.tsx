import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';

import { AnalysisActions } from '@/components/analysis-actions';
import { AnalysisTitle } from '@/components/analysis-title';
import { DistrictPanel } from '@/components/district-panel';
import { ReportFooter } from '@/components/report-footer';
import { ExposureMapCard } from '@/components/settings/exposure-area-setting';
import { selectedDistrictAtom } from '@/store/exposure';

/**
 * Exposición climática: until a district is picked the map fills the content column and
 * the prompt sits in the settings column; once picked, the map moves into the settings
 * column's área de interés and the content column shows the district.
 */
export const Route = createFileRoute('/analisis/exposicion-climatica')({
  component: ExposicionPage,
});

function ExposicionPage() {
  return (
    <>
      <h1 className="sr-only">Exposición climática</h1>
      <ClientOnly fallback={<MapCardPlaceholder />}>
        <ExposureContent />
      </ClientOnly>
    </>
  );
}

function ExposureContent() {
  const district = useAtomValue(selectedDistrictAtom);
  if (!district) return <ExposureMapCard />;

  return (
    <>
      <AnalysisTitle title="Exposición climática" />
      <DistrictPanel />
      <ReportFooter />
      <AnalysisActions riesgo="exposicion_climatica" />
    </>
  );
}

/** The map card's footprint before hydration, inert. */
function MapCardPlaceholder() {
  return <div aria-hidden className="min-h-108 flex-1 rounded-3xl bg-card" />;
}
