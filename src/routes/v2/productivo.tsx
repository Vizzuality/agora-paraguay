import { ClientOnly, createFileRoute } from '@tanstack/react-router';

import { RiskPageContent } from '@/components/settings/risk-page-content';

/** Riesgo productivo in the redesign: the selection map, then the analysis. */
export const Route = createFileRoute('/v2/productivo')({
  component: ProductivoPage,
});

function ProductivoPage() {
  return (
    <ClientOnly fallback={<h1 className="sr-only">Riesgo productivo</h1>}>
      <RiskPageContent title="Riesgo productivo" />
    </ClientOnly>
  );
}
