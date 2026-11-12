import { ClientOnly, createFileRoute } from '@tanstack/react-router';

import { RiskPageContent } from '@/components/settings/risk-page-content';

/** Riesgo sanitario in the redesign: the selection map, then the analysis. */
export const Route = createFileRoute('/v2/sanitario')({
  component: SanitarioPage,
});

function SanitarioPage() {
  return (
    <ClientOnly fallback={<h1 className="sr-only">Riesgo sanitario</h1>}>
      <RiskPageContent title="Riesgo sanitario" />
    </ClientOnly>
  );
}
