import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { CircleArrowRight, SquarePen, Undo2, Upload } from 'lucide-react';
import { useRef } from 'react';

import {
  NO_PARCEL_INTERSECTION_MESSAGE,
  PARCELS_REQUEST_FAILED_MESSAGE,
} from '@/components/error-toast';
import { AnalysedParcelsLayers } from '@/components/map/analysed-parcels-layers';
import { PanelMap } from '@/components/map/panel-map';
import { ParcelPicker } from '@/components/settings/parcel-picker';
import { SettingCardButton } from '@/components/settings/setting-card';
import { UploadFeedback } from '@/components/sidebar/upload-feedback';
import { Button } from '@/components/ui/button';
import { parcelLabel } from '@/lib/analysis/parcel-label';
import { selectionStep } from '@/lib/selection-steps';
import { UPLOAD_ACCEPT } from '@/lib/upload/parse-file';
import { useUploadFile } from '@/lib/upload/use-upload-file';
import { useConfirmedParcels } from '@/lib/use-confirmed-parcels';
import { activeParcelIdAtom, analysedParcelIdsAtom } from '@/store/analysis';
import { clearSelectionAtom, drawAtom, startDrawAtom } from '@/store/draw';
import { analysedViewAtom, backToSelectionAtom, startAnalysisAtom } from '@/store/mode';
import { areaRejectionAtom } from '@/store/selection';
import { uploadResultAtom } from '@/store/upload';

/** What the closed heading says: the open parcel once analysed, nothing before. */
export function useAreaSelectionLabel(): string | undefined {
  const analysed = useAtomValue(analysedViewAtom);
  const parcels = useAtomValue(analysedParcelIdsAtom);
  const activeId = useAtomValue(activeParcelIdAtom);

  if (!analysed) return undefined;

  return activeId === null ? 'Todas' : parcelLabel(activeId, parcels);
}

/**
 * Área de interés: building the selection (upload or draw, then Reiniciar / Analizar,
 * the map in the content column), or, once analysed, the parcel picker (Todas included), Nuevo análisis
 * and the mini map. Reads atoms: render inside `<ClientOnly>`.
 */
export function AreaSetting() {
  return useAtomValue(analysedViewAtom) ? <AnalysedArea /> : <SelectingArea />;
}

const DESCRIPTION = {
  area: 'Suba un archivo con su área de interés o dibuje un polígono en el mapa para visualizar las parcelas disponibles.',
  confirm:
    'Verifique que estas son las parcelas que desea y pulse Analizar. Use el mapa para seleccionar y deseleccionar parcelas.',
};

function SelectingArea() {
  const draw = useAtomValue(drawAtom);
  // The type is the route here, so the selection never sits on step 1.
  const step = selectionStep({
    analysisType: 'sanitario',
    areaCount: draw.polygons.length,
    drawing: draw.tool === 'draw',
  });

  return (
    <>
      <p className="text-sm text-muted-foreground">
        {step === 3 ? DESCRIPTION.confirm : DESCRIPTION.area}
      </p>
      {step === 3 ? <ConfirmCards /> : <AreaCards />}
      <UploadFeedback />
    </>
  );
}

/** Subir archivo and Dibujar polígono; while drawing, Borrar mapa and the how-to. */
function AreaCards() {
  const draw = useAtomValue(drawAtom);
  const uploadResult = useAtomValue(uploadResultAtom);
  const [rejection, setRejection] = useAtom(areaRejectionAtom);
  const startDraw = useSetAtom(startDrawAtom);
  const restart = useSetAtom(clearSelectionAtom);
  const handleChange = useUploadFile();
  const inputRef = useRef<HTMLInputElement>(null);
  const drawing = draw.tool === 'draw';
  const uploadFailed = uploadResult?.error != null || rejection?.source === 'upload';

  return (
    <>
      <fieldset className="grid grid-cols-2 gap-1.5">
        <legend className="sr-only">Seleccionar parcelas para análisis</legend>

        <SettingCardButton
          icon={Upload}
          // The entry point behind the showing error stays outlined, as the design does.
          active={uploadFailed}
          disabled={!draw.bound}
          onClick={() => {
            setRejection(null);
            inputRef.current?.click();
          }}
        >
          Subir archivo
        </SettingCardButton>

        <SettingCardButton
          icon={SquarePen}
          active={drawing}
          aria-pressed={drawing}
          disabled={!draw.bound}
          // A drawing session starts from scratch; Borrar mapa clears it and disarms.
          onClick={() => (drawing ? restart() : startDraw())}
        >
          {drawing ? 'Borrar mapa' : 'Dibujar polígono'}
        </SettingCardButton>

        {/* A real input, so Playwright's `setInputFiles` and screen readers find it. */}
        <input
          ref={inputRef}
          type="file"
          accept={UPLOAD_ACCEPT}
          onChange={(event) => void handleChange(event)}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />
      </fieldset>

      {drawing && uploadResult?.error == null && (
        <p className="text-sm text-muted-foreground">
          Haga clic para comenzar el polígono, luego haga clic para añadir cada vértice. Termine
          haciendo clic en el punto de inicio, haciendo doble clic o pulsando Enter.
        </p>
      )}
    </>
  );
}

/** Reiniciar or Analizar the parcels the areas selected; Analizar stays an explicit step. */
function ConfirmCards() {
  const { parcelIds, isError, noIntersection } = useConfirmedParcels();
  const restart = useSetAtom(clearSelectionAtom);
  const startAnalysis = useSetAtom(startAnalysisAtom);

  return (
    <div aria-live="polite" className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-1.5">
        <SettingCardButton icon={Undo2} onClick={() => restart()}>
          Reiniciar
        </SettingCardButton>
        <SettingCardButton
          icon={CircleArrowRight}
          primary
          disabled={parcelIds.length === 0}
          onClick={() => startAnalysis(parcelIds)}
        >
          Analizar
        </SettingCardButton>
      </div>

      {isError && <p className="text-sm text-destructive">{PARCELS_REQUEST_FAILED_MESSAGE}</p>}
      {noIntersection && (
        <p className="text-sm text-destructive">{NO_PARCEL_INTERSECTION_MESSAGE}</p>
      )}
    </div>
  );
}

/** An área action: icon left of its label, 48px tall, as the setting cards' row form. */
const AREA_ACTION_CLASS =
  'h-12 gap-2.5 rounded-2xl px-8 font-normal max-md:px-4 [&_svg:not([class*=size-])]:size-6';

/** Once analysed: which parcel the page reads (Todas among them), Nuevo análisis, the mini map. */
function AnalysedArea() {
  const backToSelection = useSetAtom(backToSelectionAtom);

  return (
    <>
      {/* The report names the parcel in the heading instead (`SettingsSection`). */}
      <div className="flex items-end gap-3 pt-2 print:hidden">
        {/* Todas is one of its options: the picker takes the row's free width. */}
        <ParcelPicker />
        <Button className={AREA_ACTION_CLASS} onClick={() => backToSelection()}>
          <SquarePen aria-hidden strokeWidth={1.5} />
          Nuevo análisis
        </Button>
      </div>

      {/* Edge to edge under the controls, as the design bleeds it to the card's corners. */}
      <div className="relative -mx-6 -mb-6 h-70 overflow-hidden rounded-3xl bg-muted print:h-120 paper:h-120">
        <PanelMap>
          <AnalysedParcelsLayers />
        </PanelMap>
      </div>
    </>
  );
}
