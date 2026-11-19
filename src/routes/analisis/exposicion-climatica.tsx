import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';

import { AnalysisTitle } from '@/components/analysis-title';
import { DistrictPanel } from '@/components/district-panel';
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

const TITLE = 'Exposición climática';

function ExposicionPage() {
  return (
    <ClientOnly
      fallback={
        <>
          <h1 className="sr-only">{TITLE}</h1>
          <MapCardPlaceholder />
        </>
      }
    >
      <ExposureContent />
    </ClientOnly>
  );
}

/** Before a pick, the map with a hidden heading; after it, the titled district report. */
function ExposureContent() {
  const district = useAtomValue(selectedDistrictAtom);

  if (!district) {
    return (
      <>
        <h1 className="sr-only">{TITLE}</h1>
        <ExposureMapCard />
      </>
    );
  }

  return (
    <>
      <AnalysisTitle title={TITLE} />
      <DistrictPanel />
    </>
  );
}

/** The map card's footprint before hydration, inert. */
function MapCardPlaceholder() {
  return <div aria-hidden className="min-h-108 flex-1 rounded-3xl bg-card" />;
}
