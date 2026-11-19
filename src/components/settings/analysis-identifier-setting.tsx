import { useAtomValue, useSetAtom } from 'jotai';
import { useId } from 'react';

import { FLOATING_FIELD_CLASS, FloatingLabel } from '@/components/ui/floating-label';
import { Input } from '@/components/ui/input';
import { analysisIdentifierAtom } from '@/store/analysis-identifier';

/** The closed heading's line: the identifier once there is one. */
export function useAnalysisIdentifierLabel(): string | undefined {
  return useAtomValue(analysisIdentifierAtom) || undefined;
}

/**
 * Identificador de análisis: one field for the user's reference, kept for the session
 * (`analysisIdentifierAtom`). Reads atoms: render inside `<ClientOnly>`.
 */
export function AnalysisIdentifierSetting() {
  const identifier = useAtomValue(analysisIdentifierAtom);
  const setIdentifier = useSetAtom(analysisIdentifierAtom);
  const id = useId();

  return (
    // Floating label: the label is the placeholder, hence `placeholder`.
    <div className="relative pt-2">
      <Input
        id={id}
        value={identifier}
        onChange={(event) => setIdentifier(event.target.value)}
        placeholder="Identificador"
        autoComplete="off"
        className={FLOATING_FIELD_CLASS}
      />
      <FloatingLabel htmlFor={id}>Identificador</FloatingLabel>
    </div>
  );
}
