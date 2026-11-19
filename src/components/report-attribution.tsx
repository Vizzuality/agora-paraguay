import { useAtomValue } from 'jotai';
import { useState } from 'react';

import { reportAttribution } from '@/lib/analysis/report';
import { analysisIdentifierAtom } from '@/store/analysis-identifier';
import { reportGeneratedAtAtom } from '@/store/report';

/**
 * The report's closing line (`reportAttribution`), on paper only. Dated when Exportar
 * informe was pressed (`printReport`); a print from the browser's own menu falls back to
 * when the page opened. Reads atoms: render inside `<ClientOnly>`.
 */
export function ReportAttribution() {
  const identifier = useAtomValue(analysisIdentifierAtom);
  const generatedAt = useAtomValue(reportGeneratedAtAtom);
  const [openedAt] = useState(() => new Date());

  return (
    <p className="hidden text-xs text-muted-foreground print:block">
      {reportAttribution(identifier, generatedAt ?? openedAt)}
    </p>
  );
}
