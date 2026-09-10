import { useAtomValue } from 'jotai';
import type { ReactNode } from 'react';

import { AreaActions } from '@/components/sidebar/area-actions';
import { ConfirmActions } from '@/components/sidebar/confirm-actions';
import { SelectionSteps } from '@/components/sidebar/selection-steps';
import { UploadFeedback } from '@/components/sidebar/upload-feedback';
import type { PanelStep } from '@/lib/selection-steps';
import { drawAtom } from '@/store/draw';
import { selectionStepAtom } from '@/store/selection';
import { uploadResultAtom } from '@/store/upload';

const DESCRIPTIONS: Record<PanelStep, string> = {
  1: 'Suba un archivo con su área de interés o dibuje un polígono en el mapa para visualizar las parcelas disponibles.',
  2: 'Verifique que estas son las parcelas que desea y pulse Analizar. Use el mapa para seleccionar y deseleccionar parcelas.',
};

/**
 * The selection panel's content, driven by the derived step (Figma 7172:1562 for step
 * 1, 7172:1771 for step 2). Rendered inside `<ClientOnly>`: every part reads atoms.
 */
export function SelectionBlock() {
  const step = useAtomValue(selectionStepAtom);

  return (
    <SelectionBlockLayout step={step}>
      {step === 1 ? (
        <>
          <AreaActions />
          <DrawInstructions />
        </>
      ) : (
        <ConfirmActions />
      )}

      <UploadFeedback />
    </SelectionBlockLayout>
  );
}

/** The static frame around the step content; doubles as the SSR fallback with step 1. */
export function SelectionBlockLayout({
  step,
  children,
}: Readonly<{ step: PanelStep; children?: ReactNode }>) {
  return (
    <section className="flex flex-col gap-10 px-10 pb-6">
      <h1 className="text-4xl font-semibold tracking-[-0.015em]">Selección de parcelas</h1>

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
