import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';

import { AnalysisHeader } from '@/components/analysis-header';
import { AnalysisStatus } from '@/components/analysis-status';
import { AnalysisWidgetCard } from '@/components/analysis-widget-card';
import { LoginGate } from '@/components/auth/login-gate';
import { WidgetAI } from '@/components/widget-ai';
import { WidgetGrid } from '@/components/widget-grid';
import { analysisWidgets } from '@/lib/analysis/analysis-widgets';
import { selectableIndicators, visibleIndicators } from '@/lib/analysis/indicator-picker';
import { useApplicableIndicators } from '@/lib/analysis/use-applicable-indicators';
import { useDescribe } from '@/lib/analysis/use-describe';
import { useSession } from '@/lib/auth/use-session';
import { analysedParcelIdsAtom, selectedIndicatorIdsAtom } from '@/store/analysis';

/**
 * Riesgo productivo needs an account: login gate until a session exists, with neither
 * hero nor title above it (the login screen design has none). Behind it, the (still
 * empty) widget grid and the AI summary widget.
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

      <ClientOnly fallback={<LoginGate />}>
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
 * The productivo widgets read the whole selection, not the hero's open tab: an open number
 * lists every parcel, a category counts them per class — or,
 * with a single parcel analysed, reads its class on the ruler (`individual` scope). In
 * metadata order, restricted to what the picker shows and to what applies to the crop
 * (`useApplicableIndicators`). The range indicators (IEP, ProInf, Puntuación) have their
 * own design, not built yet.
 */
function ProductivoWidgets() {
  const { analysis, indicators, indicatorsError, parcelIds } =
    useApplicableIndicators('productivo');
  const selected = useAtomValue(selectedIndicatorIdsAtom).productivo;
  const describe = useDescribe('productivo');

  const shown = indicators
    ? visibleIndicators(selectableIndicators(indicators, 'productivo'), selected)
    : undefined;
  const answered = analysis.data?.indicators ?? [];
  const scope = parcelIds.length > 1 ? 'multiple' : 'individual';
  const widgets = analysisWidgets({
    parcels: answered,
    parcelIds,
    indicators: shown,
    riesgo: 'productivo',
    scope,
    parcel: answered.find((entry) => String(entry.parcel_id) === parcelIds[0]),
  }).map((widget) => ({ ...widget, description: describe(widget.description) }));

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
