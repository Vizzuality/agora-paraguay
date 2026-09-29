import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';

import { AnalysisHeader } from '@/components/analysis-header';
import { AnalysisStatus } from '@/components/analysis-status';
import { LoginGate } from '@/components/auth/login-gate';
import { CategoryCountCard } from '@/components/category-count-card';
import { ParcelValuesCard } from '@/components/parcel-values-card';
import { WidgetAI } from '@/components/widget-ai';
import { WidgetGrid } from '@/components/widget-grid';
import { selectableIndicators, visibleIndicators } from '@/lib/analysis/indicator-picker';
import { productivoTiles } from '@/lib/analysis/productivo-tiles';
import { useApplicableIndicators } from '@/lib/analysis/use-applicable-indicators';
import { useDescribe } from '@/lib/analysis/use-describe';
import { useSession } from '@/lib/auth/use-session';
import { analysedParcelIdsAtom, selectedIndicatorIdsAtom } from '@/store/analysis';

/**
 * Riesgo productivo needs an account: login gate until a session exists, with neither
 * hero nor title above it (the login screen design has none). Behind it, the (still
 * empty) widget grid and the AI summary tile.
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
 * The productivo tiles read the whole selection, not the hero's open tab: an open number
 * lists every parcel (Figma Widget01), a category counts them per class (Widget03). In
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
  const tiles = productivoTiles(answered, parcelIds, shown).map((tile) => ({
    ...tile,
    description: describe(tile.description),
  }));

  return (
    <div className="flex flex-col gap-4">
      <AnalysisStatus analysis={analysis} indicatorsError={indicatorsError} />
      <WidgetGrid>
        {tiles.map((tile) =>
          tile.kind === 'parcel-values' ? (
            <ParcelValuesCard key={tile.id} {...tile} />
          ) : (
            <CategoryCountCard key={tile.id} {...tile} />
          ),
        )}
      </WidgetGrid>
    </div>
  );
}
