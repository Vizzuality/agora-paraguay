import { ClientOnly, createFileRoute } from '@tanstack/react-router';

import { SanitarioWidgets } from '@/components/sanitario-widgets';
import { RiskPageContent } from '@/components/settings/risk-page-content';

/** Riesgo sanitario in the redesign, public: the selection map, then the summary and the widgets. */
export const Route = createFileRoute('/v2/sanitario')({
  component: SanitarioPage,
});

function SanitarioPage() {
  return (
    <ClientOnly fallback={<h1 className="sr-only">Riesgo sanitario</h1>}>
      <RiskPageContent title="Riesgo sanitario" analysis={<SanitarioWidgets />} />
    </ClientOnly>
  );
}
