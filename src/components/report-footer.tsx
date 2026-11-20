import { useAtomValue } from 'jotai';
import { useState } from 'react';

import { reportAttribution } from '@/lib/analysis/report';
import { analysisIdentifierAtom } from '@/store/analysis-identifier';
import { reportGeneratedAtAtom } from '@/store/report';

/**
 * The report's closing card (`reportAttribution`), on paper only, the identifier and date
 * in italics. Dated when Exportar informe was pressed (`printReport`), otherwise when the
 * page opened. Reads atoms: render inside `<ClientOnly>`.
 */
export function ReportFooter() {
  const identifier = useAtomValue(analysisIdentifierAtom);
  const generatedAt = useAtomValue(reportGeneratedAtAtom);
  const [openedAt] = useState(() => new Date());

  return (
    <footer className="hidden rounded-3xl border-2 border-border bg-background p-6 backdrop-blur-xs print:block">
      <p className="text-center text-sm text-muted-foreground">
        {reportAttribution(identifier, generatedAt ?? openedAt).map(({ text, value }) =>
          value ? <em key={text}>{text}</em> : text,
        )}
      </p>
    </footer>
  );
}
