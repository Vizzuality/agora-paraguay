import { useAtomValue } from 'jotai';

import { analysisIdentifierAtom } from '@/store/analysis-identifier';

/**
 * The analysis's heading, on screen and atop the report, with the Identificador de
 * análisis beside it when one was entered. Reads atoms: render inside `<ClientOnly>`.
 */
export function AnalysisTitle({ title }: Readonly<{ title: string }>) {
  const identifier = useAtomValue(analysisIdentifierAtom).trim();

  return (
    <div className="flex items-center justify-between gap-6">
      <h1 className="text-6xl leading-none font-thin text-foreground">{title}</h1>
      {identifier && (
        <dl className="flex min-w-0 flex-col items-end gap-1 text-right">
          <dt className="text-sm text-muted-foreground">Identificador de análisis</dt>
          <dd className="max-w-full break-words text-foreground">{identifier}</dd>
        </dl>
      )}
    </div>
  );
}
