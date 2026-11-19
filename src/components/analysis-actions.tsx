import { ExportReportButton } from '@/components/export-report-button';
import { IndicatorPicker } from '@/components/indicator-picker';
import type { Riesgo } from '@/lib/api/metadata/schemas';
import { cn } from '@/lib/utils';

const ACTION_CLASS = 'h-12 flex-1 rounded-2xl border px-8 font-normal';

/** Personalizar indicadores beside Exportar informe, above the analysis; off the report. */
export function AnalysisActions({ riesgo }: Readonly<{ riesgo: Riesgo }>) {
  return (
    <div className="flex items-center gap-4 print:hidden">
      <IndicatorPicker riesgo={riesgo} className={cn(ACTION_CLASS, 'text-primary')} />
      <ExportReportButton riesgo={riesgo} className={ACTION_CLASS} />
    </div>
  );
}
