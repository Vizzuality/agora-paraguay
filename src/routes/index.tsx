import { ClientOnly, createFileRoute } from '@tanstack/react-router';

import { AnalysisEntryCard } from '@/components/analysis-entry-card';
import { PageFrame } from '@/components/frame/page-frame';
import { PanelMap } from '@/components/map/panel-map';
import { LANDING_ENTRIES } from '@/lib/nav-links';

/** The landing: one card per analysis type on the left, Paraguay on the map on the right. */
export const Route = createFileRoute('/')({
  component: Landing,
});

function Landing() {
  return (
    <PageFrame
      settingsLabel="Tipos de análisis"
      settings={
        <ClientOnly>
          <nav aria-label="Tipos de análisis" className="flex flex-col gap-1.5">
            {LANDING_ENTRIES.map((entry) => (
              <AnalysisEntryCard key={entry.label} {...entry} />
            ))}
          </nav>
        </ClientOnly>
      }
    >
      <h1 className="sr-only">Ágora Paraguay</h1>
      {/* The window's height less the column's padding, as on the analysis pages. */}
      <div className="relative h-[calc(100dvh-5rem)] min-h-96 overflow-hidden rounded-3xl bg-muted">
        <ClientOnly>
          <PanelMap />
        </ClientOnly>
      </div>
    </PageFrame>
  );
}
