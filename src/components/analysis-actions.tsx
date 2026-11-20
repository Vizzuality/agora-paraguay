import { ExportReportButton } from '@/components/export-report-button';
import { ExposureIndicatorPicker, RiskIndicatorPicker } from '@/components/indicator-picker';
import type { IndicatorsRiesgo } from '@/lib/api/metadata/schemas';
import { cn } from '@/lib/utils';

const ACTION_CLASS = 'h-12 flex-1 rounded-2xl border px-8 font-normal';

/** Personalizar indicadores beside Exportar informe, above the analysis; off the report. */
export function AnalysisActions({ riesgo }: Readonly<{ riesgo: IndicatorsRiesgo }>) {
  const pickerClass = cn(ACTION_CLASS, 'text-primary');

  return (
    <div className="flex items-center gap-4 print:hidden">
      {riesgo === 'exposicion_climatica' ? (
        <ExposureIndicatorPicker className={pickerClass} />
      ) : (
        <RiskIndicatorPicker riesgo={riesgo} className={pickerClass} />
      )}
      <ExportReportButton riesgo={riesgo} className={ACTION_CLASS} />
    </div>
  );
}
