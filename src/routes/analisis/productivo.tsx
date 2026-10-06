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
import {
  activeParcelIdAtom,
  analysedParcelIdsAtom,
  selectedIndicatorIdsAtom,
} from '@/store/analysis';

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
 * The productivo widgets follow the hero's open tab (`activeParcelIdAtom`), as sanitario's
 * do. Under Todas (`multiple` scope) a number — open, or a range on its own scale — bins
 * every parcel's value and a category counts them per class; on a parcel tab
 * (`individual`) the number is that parcel's figure on the same scale and the category
 * reads its class on the ruler. In metadata order, restricted to what the picker shows
 * and to what applies to the crop (`useApplicableIndicators`).
 */
function ProductivoWidgets() {
  const { analysis, indicators, indicatorsError, parcelIds } =
    useApplicableIndicators('productivo');
  const activeId = useAtomValue(activeParcelIdAtom);
  const selected = useAtomValue(selectedIndicatorIdsAtom).productivo;
  const describe = useDescribe('productivo');

  const shown = indicators
    ? visibleIndicators(selectableIndicators(indicators, 'productivo'), selected)
    : undefined;
  const answered = analysis.data?.indicators ?? [];
  const scope = activeId === null ? 'multiple' : 'individual';
  const widgets = analysisWidgets({
    parcels: answered,
    parcelIds,
    indicators: shown,
    riesgo: 'productivo',
    scope,
    parcel:
      activeId === null
        ? undefined
        : answered.find((entry) => String(entry.parcel_id) === activeId),
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
