import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';

import { AnalysisActions } from '@/components/analysis-actions';
import { LoginRequired } from '@/components/auth/login-dialog';
import { ProductivoWidgets } from '@/components/productivo-widgets';
import { RiskPageContent } from '@/components/settings/risk-page-content';
import { WidgetAI } from '@/components/widget-ai';
import { useSession } from '@/lib/auth/use-session';
import { activeParcelIdAtom, analysedParcelIdsAtom } from '@/store/analysis';

/** Riesgo productivo in the redesign: the selection map, then, with an account, the analysis. */
export const Route = createFileRoute('/analisis/productivo')({
  component: ProductivoPage,
});

function ProductivoPage() {
  return (
    <ClientOnly fallback={<h1 className="sr-only">Riesgo productivo</h1>}>
      <RiskPageContent title="Riesgo productivo" analysis={<ProductivoAnalysis />} />
    </ClientOnly>
  );
}

/**
 * The analysis needs an account: the login modal until a session exists. Behind it,
 * Personalizar indicadores beside Exportar informe, the AI summary and the widgets.
 */
function ProductivoAnalysis() {
  const session = useSession();
  const parcelIds = useAtomValue(analysedParcelIdsAtom);
  const activeId = useAtomValue(activeParcelIdAtom);

  if (!session) return <LoginRequired />;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <AnalysisActions riesgo="productivo" />
      {/* Keyed by the tab: a summary written for one tab never shows under another. */}
      <WidgetAI key={activeId ?? 'todas'} parcels={parcelIds} />
      <ProductivoWidgets />
    </div>
  );
}
