import { useAtomValue, useSetAtom } from 'jotai';
import { CircleArrowRight, SquarePen, Undo2, Upload } from 'lucide-react';
import { useId, useRef } from 'react';

import {
  NO_PARCEL_INTERSECTION_MESSAGE,
  PARCELS_REQUEST_FAILED_MESSAGE,
} from '@/components/error-toast';
import { AnalysedParcelsLayers } from '@/components/map/analysed-parcels-layers';
import { PanelMap } from '@/components/map/panel-map';
import { SettingCardButton } from '@/components/settings/setting-card';
import { UploadFeedback } from '@/components/sidebar/upload-feedback';
import { Button } from '@/components/ui/button';
import { FLOATING_FIELD_CLASS, FloatingLabel } from '@/components/ui/floating-label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { parcelLabel } from '@/lib/analysis/parcel-label';
import { selectionStep } from '@/lib/selection-steps';
import { UPLOAD_ACCEPT } from '@/lib/upload/parse-file';
import { useUploadFile } from '@/lib/upload/use-upload-file';
import { useConfirmedParcels } from '@/lib/use-confirmed-parcels';
import { cn } from '@/lib/utils';
import { activeParcelIdAtom, activeParcelTabAtom, analysedParcelIdsAtom } from '@/store/analysis';
import { drawAtom, restartSelectionAtom, startDrawAtom } from '@/store/draw';
import { analysedViewAtom, backToSelectionAtom, startAnalysisAtom } from '@/store/mode';
import { areaRejectionAtom } from '@/store/selection';
import { uploadResultAtom } from '@/store/upload';

const ALL = 'todas';

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
 * the map in the content column), or, once analysed, the parcel picker, Editar parcelas
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
  const rejection = useAtomValue(areaRejectionAtom);
  const setRejection = useSetAtom(areaRejectionAtom);
  const startDraw = useSetAtom(startDrawAtom);
  const restart = useSetAtom(restartSelectionAtom);
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
  const restart = useSetAtom(restartSelectionAtom);
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

/** Once analysed: which parcel the page reads, the way back to the selection, the mini map. */
function AnalysedArea() {
  const backToSelection = useSetAtom(backToSelectionAtom);

  return (
    <>
      <div className="flex items-center gap-6">
        <ParcelSelect />
        <Button
          variant="ghost"
          className="h-12 shrink-0 rounded-2xl px-4 font-normal text-primary"
          onClick={() => backToSelection()}
        >
          <SquarePen aria-hidden />
          Editar parcelas
        </Button>
      </div>

      {/* Edge to edge under the controls, as the design bleeds it to the card's corners. */}
      <div className="relative -mx-6 -mb-6 h-67 overflow-hidden rounded-3xl bg-muted">
        <PanelMap>
          <AnalysedParcelsLayers />
        </PanelMap>
      </div>
    </>
  );
}

/** Parcela: Todas (more than one parcel) then each analysed parcel, as "Parcela N". */
function ParcelSelect() {
  const parcels = useAtomValue(analysedParcelIdsAtom);
  const activeId = useAtomValue(activeParcelIdAtom);
  const setActiveTab = useSetAtom(activeParcelTabAtom);
  const id = useId();
  const options = parcels.length > 1 ? [ALL, ...parcels] : parcels;

  return (
    <div className="relative min-w-0 flex-1">
      <Select
        value={activeId ?? ALL}
        onValueChange={(value) => setActiveTab(value === ALL ? null : value)}
        disabled={options.length === 1}
      >
        <SelectTrigger id={id} className={cn(FLOATING_FIELD_CLASS, 'data-[size=default]:h-12')}>
          <SelectValue placeholder=" " />
        </SelectTrigger>
        <FloatingLabel htmlFor={id}>Parcela</FloatingLabel>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option === ALL ? 'Todas' : parcelLabel(option, parcels)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
