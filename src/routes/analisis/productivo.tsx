import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';

import { AnalysisHeader } from '@/components/analysis-header';
import { LoginGate } from '@/components/auth/login-gate';
import { WidgetGrid } from '@/components/widget-grid';
import { WidgetIa } from '@/components/widget-ia';
import { analysedParcelIdsAtom } from '@/store/analysis';
import { sessionAtom } from '@/store/auth';

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
  const session = useAtomValue(sessionAtom);

  if (!session) return null;

  return <AnalysisHeader riesgo="productivo" />;
}

function ProductivoGate() {
  const session = useAtomValue(sessionAtom);
  const parcelIds = useAtomValue(analysedParcelIdsAtom);

  if (!session) return <LoginGate />;

  return (
    <div className="flex flex-col gap-4">
      <WidgetGrid />
      <WidgetIa parcels={parcelIds} />
    </div>
  );
}
