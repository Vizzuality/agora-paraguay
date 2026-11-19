import { useAtomValue } from 'jotai';

import { analysisIdentifierAtom } from '@/store/analysis-identifier';

/**
 * The report's title row, on paper only, with the Identificador de análisis beside it when
 * one was entered. The page's heading stays the hidden `<h1>`. Reads atoms: render inside
 * `<ClientOnly>`.
 */
export function AnalysisTitle({ title }: Readonly<{ title: string }>) {
  const identifier = useAtomValue(analysisIdentifierAtom).trim();

  return (
    <div className="hidden items-center justify-between gap-6 print:flex">
      <p className="text-6xl leading-none font-thin text-foreground">{title}</p>
      {identifier && (
        <dl className="flex min-w-0 flex-col items-end gap-1 text-right">
          <dt className="text-sm text-muted-foreground">Identificador de análisis</dt>
          <dd className="max-w-full break-words text-foreground">{identifier}</dd>
        </dl>
      )}
    </div>
  );
}
