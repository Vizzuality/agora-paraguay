import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';

import { AnalysisHeader } from '@/components/analysis-header';
import { AnalysisStatus } from '@/components/analysis-status';
import { AnalysisWidgetCard } from '@/components/analysis-widget-card';
import { LoginGate } from '@/components/auth/login-gate';
import { WidgetAI } from '@/components/widget-ai';
import { WidgetGrid } from '@/components/widget-grid';
import { useRiesgoWidgets } from '@/lib/analysis/use-riesgo-widgets';
import { useSession } from '@/lib/auth/use-session';
import { analysedParcelIdsAtom } from '@/store/analysis';

/**
 * Riesgo productivo needs an account: login gate until a session exists, with neither
 * hero nor title above it (the login screen design has none). Behind it, the AI summary
 * widget and the widgets.
 */
export const Route = createFileRoute('/analisis/productivo')({
  component: ProductivoPage,
});

function ProductivoPage() {
  return (
    <>
      <ClientOnly>
        <ProductivoHeader />
      </ClientOnly>

      <ClientOnly fallback={<LoginGate hydrating />}>
        <ProductivoGate />
      </ClientOnly>
    </>
  );
}

/** Hero and title only for a logged-in analyst. */
function ProductivoHeader() {
  const session = useSession();

  if (!session) return null;

  return <AnalysisHeader riesgo="productivo" />;
}

function ProductivoGate() {
  const session = useSession();
  const parcelIds = useAtomValue(analysedParcelIdsAtom);

  if (!session) return <LoginGate />;

  return (
    <div className="flex flex-col gap-4">
      <WidgetAI parcels={parcelIds} />
      <ProductivoWidgets />
    </div>
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
      <WidgetGrid>
        {widgets.map((widget) => (
          <AnalysisWidgetCard key={widget.id} widget={widget} />
        ))}
      </WidgetGrid>
    </div>
  );
}
