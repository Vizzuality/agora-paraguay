import { useAtom } from 'jotai';
import { useId } from 'react';

import { InfoTip } from '@/components/info-tip';
import { FLOATING_CHIP_CLASS, FLOATING_FIELD_CLASS } from '@/components/ui/floating-label';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { analysisIdentifierAtom } from '@/store/analysis-identifier';

const LABEL = 'Identificador de análisis';
const DESCRIPTION =
  'Una referencia propia para este análisis. Se mantiene durante la sesión y se borra al reiniciar la selección de parcelas.';

/**
 * Identificador de análisis, under the analysis types: the user's reference, kept for the
 * session (`analysisIdentifierAtom`). Its caption always sits on the border, with the info
 * tip beside it — outside the `<label>`, which cannot hold a button. The caption masks the
 * border with the surface the field sits on: `card` in the settings section, `background`
 * on the landing. Reads atoms: render inside `<ClientOnly>`.
 */
export function AnalysisIdentifierSetting({
  surface = 'card',
}: Readonly<{ surface?: 'card' | 'background' }>) {
  const [identifier, setIdentifier] = useAtom(analysisIdentifierAtom);
  const id = useId();

  return (
    <div className="relative pt-2">
      <Input
        id={id}
        value={identifier}
        onChange={(event) => setIdentifier(event.target.value)}
        placeholder="Inserte código de proyecto"
        autoComplete="off"
        className={cn(FLOATING_FIELD_CLASS, 'border-border')}
      />
      <div
        className={cn(
          FLOATING_CHIP_CLASS,
          'top-2 flex items-center gap-2',
          surface === 'background' && 'bg-background',
        )}
      >
        <Label htmlFor={id} className="text-xs leading-3 font-normal">
          {LABEL}
        </Label>
        <InfoTip description={DESCRIPTION} subject={LABEL} />
      </div>
    </div>
  );
}
