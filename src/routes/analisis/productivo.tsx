import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';

import { AnalysisPanel } from '@/components/analysis-panel';
import { AnalysisShell } from '@/components/analysis-shell';
import { AnalysisSidebar } from '@/components/analysis-sidebar';
import { AnalysisStatus } from '@/components/analysis-status';
import { AnalysisWidgetCard } from '@/components/analysis-widget-card';
import { LoginGate } from '@/components/auth/login-gate';
import { WidgetAI } from '@/components/widget-ai';
import { WidgetGrid } from '@/components/widget-grid';
import { useRiesgoWidgets } from '@/lib/analysis/use-riesgo-widgets';
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

/**
 * The widgets (`useRiesgoWidgets`), restricted to what applies to the crop
 * (`useApplicableIndicators`): under Todas a number bins every parcel's value and a
 * category counts them per class; on a parcel tab the number is that parcel's figure on
 * the same scale and the category reads its class on the ruler.
 */
function ProductivoWidgets() {
  const { analysis, indicatorsError, widgets } = useRiesgoWidgets('productivo');

  return (
    <div className="flex flex-col gap-4">
      <AnalysisStatus analysis={analysis} indicatorsError={indicatorsError} />
      <AnalysisPanel busy={analysis.isPlaceholderData}>
        <WidgetGrid>
          {widgets.map((widget) => (
            <AnalysisWidgetCard key={widget.id} widget={widget} />
          ))}
        </WidgetGrid>
      </AnalysisPanel>
    </div>
  );
}
