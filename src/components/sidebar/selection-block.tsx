import { useAtomValue } from 'jotai';
import type { ReactNode } from 'react';

import { AnalysisTypeActions } from '@/components/sidebar/analysis-type-actions';
import { AreaActions } from '@/components/sidebar/area-actions';
import { ConfirmActions } from '@/components/sidebar/confirm-actions';
import { SelectionSteps } from '@/components/sidebar/selection-steps';
import { UploadFeedback } from '@/components/sidebar/upload-feedback';
import type { SelectionStep } from '@/lib/selection-steps';
import { drawAtom } from '@/store/draw';
import { selectionStepAtom } from '@/store/selection';
import { uploadResultAtom } from '@/store/upload';

const DESCRIPTIONS: Record<SelectionStep, ReactNode> = {
  1: (
    <>
      Elija un tipo de análisis. El análisis de <em>Exposición climática</em> permite identificar
      qué distritos de Paraguay presentan soja expuesta a sequía o inundación. Los análisis de{' '}
      <em>Riesgo sanitario</em> y <em>Riesgo productivo</em> presentan diferentes riesgos por
      parcelas.
    </>
  ),
  2: 'Suba un archivo con su área de interés o dibuje un polígono en el mapa para visualizar las parcelas disponibles.',
  3: 'Verifique que estas son las parcelas que desea y pulse Analizar. Use el mapa para seleccionar y deseleccionar parcelas.',
};

/**
 * The selection panel's content, driven by the derived step. Rendered inside
 * `<ClientOnly>`: every part reads atoms.
 */
export function SelectionBlock() {
  const step = useAtomValue(selectionStepAtom);

  return (
    <SelectionBlockLayout step={step}>
      {step === 1 && <AnalysisTypeActions />}
      {step === 2 && (
        <>
          <AreaActions />
          <DrawInstructions />
        </>
      )}
      {step === 3 && <ConfirmActions />}

      <UploadFeedback />
    </SelectionBlockLayout>
  );
}

/** The static frame around the step content; doubles as the SSR fallback with step 1. */
export function SelectionBlockLayout({
  step,
  children,
}: Readonly<{ step: SelectionStep; children?: ReactNode }>) {
  return (
    <section className="flex flex-col gap-10 px-2 py-6 md:px-10 md:pt-0">
      <h1 className="text-4xl font-semibold tracking-[-0.015em]">Personalización del análisis</h1>

      <SelectionSteps current={step} />

      <p className="text-sm text-muted-foreground">{DESCRIPTIONS[step]}</p>

      {children}
    </section>
  );
}

/** The drawing how-to, only while a polygon is being traced and no error toast shows. */
function DrawInstructions() {
  const draw = useAtomValue(drawAtom);
  const uploadResult = useAtomValue(uploadResultAtom);

  if (draw.tool !== 'draw' || uploadResult?.error != null) return null;

  return (
    <p className="text-sm text-muted-foreground">
      Haga clic para comenzar el polígono, luego haga clic para añadir cada vértice.
      <br />
      Termine haciendo clic en el punto de inicio, haciendo doble clic o pulsando Enter.
    </p>
  );
}
