import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';

import { AnalysisShell } from '@/components/analysis-shell';
import { AnalysisSidebar } from '@/components/analysis-sidebar';
import { LoginGate } from '@/components/auth/login-gate';
import { ProductivoWidgets } from '@/components/productivo-widgets';
import { WidgetAI } from '@/components/widget-ai';
import { useSession } from '@/lib/auth/use-session';
import { activeParcelIdAtom, analysedParcelIdsAtom } from '@/store/analysis';

/**
 * Riesgo productivo needs an account: login gate until a session exists, full width
 * with no hero beside it (the login screen design has none). Behind it, the hero beside
 * the AI summary widget and the widgets.
 */
export const Route = createFileRoute('/analisis/productivo')({
  component: ProductivoPage,
});

function ProductivoPage() {
  return (
    <ClientOnly fallback={<LoginGate hydrating />}>
      <ProductivoGate />
    </ClientOnly>
  );
}

function ProductivoGate() {
  const session = useSession();
  const parcelIds = useAtomValue(analysedParcelIdsAtom);
  const activeId = useAtomValue(activeParcelIdAtom);

  if (!session) return <LoginGate />;

  return (
    <AnalysisShell side={<AnalysisSidebar riesgo="productivo" />}>
      {/* Keyed by the tab: a summary written for one tab never shows under another. */}
      <WidgetAI key={activeId ?? 'todas'} parcels={parcelIds} />
      <ProductivoWidgets />
    </AnalysisShell>
  );
}
