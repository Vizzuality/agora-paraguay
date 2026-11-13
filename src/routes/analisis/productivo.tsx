import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';

import { LoginGate } from '@/components/auth/login-gate';
import { ExportReportButton } from '@/components/export-report-button';
import { IndicatorPicker } from '@/components/indicator-picker';
import { ProductivoWidgets } from '@/components/productivo-widgets';
import { RiskPageContent } from '@/components/settings/risk-page-content';
import { WidgetAI } from '@/components/widget-ai';
import { useSession } from '@/lib/auth/use-session';
import { cn } from '@/lib/utils';
import { activeParcelIdAtom, analysedParcelIdsAtom } from '@/store/analysis';

const ACTION_CLASS = 'h-12 flex-1 rounded-2xl border px-8 font-normal';

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
 * The analysis needs an account: the login gate until a session exists. Behind it,
 * Personalizar indicadores beside Exportar informe, the AI summary and the widgets.
 */
function ProductivoAnalysis() {
  const session = useSession();
  const parcelIds = useAtomValue(analysedParcelIdsAtom);
  const activeId = useAtomValue(activeParcelIdAtom);

  if (!session) return <LoginGate />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 print:hidden">
        <IndicatorPicker riesgo="productivo" className={cn(ACTION_CLASS, 'text-primary')} />
        <ExportReportButton riesgo="productivo" className={ACTION_CLASS} />
      </div>
      {/* Keyed by the tab: a summary written for one tab never shows under another. */}
      <WidgetAI key={activeId ?? 'todas'} parcels={parcelIds} />
      <ProductivoWidgets />
    </div>
  );
}
