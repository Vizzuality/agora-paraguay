import { ClientOnly, createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';

import { AnalysisShell } from '@/components/analysis-shell';
import { DistrictPanel, DistrictPrompt } from '@/components/district-panel';
import { ExposureMapCard } from '@/components/exposure-map-card';
import type { ExposureMapView } from '@/components/map/exposure-layers';
import { RISK_TABS } from '@/lib/nav-links';

/**
 * Exposición climática: the country map beside the district panel, then the way to the
 * risk analyses. A district picked on the map heads the panel with its exposure indicators
 * on both map tabs.
 */
export const Route = createFileRoute('/analisis/exposicion-climatica')({
  component: ExposicionClimaticaPage,
});

function ExposicionClimaticaPage() {
  const [view, setView] = useState<ExposureMapView>('exposicion');

  return (
    <div className="flex flex-col gap-12">
      <h1 className="sr-only">Exposición climática</h1>

      <AnalysisShell side={<ExposureMapCard view={view} onViewChange={setView} />} stretch>
        <ClientOnly fallback={<DistrictPrompt />}>
          <DistrictPanel />
        </ClientOnly>
      </AnalysisShell>

      <OtherRiskAnalyses />
    </div>
  );
}

function OtherRiskAnalyses() {
  return (
    <section aria-labelledby="otros-analisis" className="flex flex-col gap-12">
      <h2 id="otros-analisis" className="text-6xl font-thin tracking-[0.408px]">
        Otros análisis de riesgo
      </h2>
      <div className="flex gap-1.5 max-md:flex-col">
        {RISK_TABS.map(({ label, riesgo, to, icon: Icon }) => {
          return (
            // Like the tabs: switching views must not stack history entries.
            <Link
              key={riesgo}
              to={to}
              replace
              className="flex flex-1 flex-col items-center justify-center gap-2.5 rounded-3xl border-3 border-secondary bg-secondary p-8 text-sm text-accent-foreground transition-colors hover:border-secondary-hover hover:bg-secondary-hover"
            >
              <Icon className="size-10 text-primary" strokeWidth={1.5} aria-hidden />
              {label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
