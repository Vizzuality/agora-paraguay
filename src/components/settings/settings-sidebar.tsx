import { useAtomValue } from 'jotai';
import { useState } from 'react';

import { DistrictPrompt } from '@/components/district-panel';
import { AnalysisIdentifierSetting } from '@/components/settings/analysis-identifier-setting';
import {
  AnalysisTypeSetting,
  useCurrentAnalysisType,
} from '@/components/settings/analysis-type-setting';
import { AreaSetting, useAreaSelectionLabel } from '@/components/settings/area-setting';
import { CropDatesSetting, useCropDatesLabel } from '@/components/settings/crop-dates-setting';
import {
  ExposureAreaSetting,
  useExposureAreaLabel,
} from '@/components/settings/exposure-area-setting';
import { SettingsSection } from '@/components/settings/settings-section';
import type { Riesgo } from '@/lib/api/metadata/schemas';
import { selectedDistrictAtom } from '@/store/exposure';
import { analysedViewAtom } from '@/store/mode';
import { paperLayoutAtom } from '@/store/report';

type SectionKey = 'analysisType' | 'area' | 'cropDates';

/**
 * The redesign's settings column, one section open at a time: the analysis type, then
 * the área de interés, open to start with since that is where the work is: parcels on a
 * riesgo, a district on the exposure map.
 * Reads atoms: render inside `<ClientOnly>`.
 */
export function SettingsSidebar() {
  const current = useCurrentAnalysisType();

  // Keyed by the type, so moving onto a riesgo opens its área de interés afresh.
  return <Sections key={String(current?.to)} />;
}

function Sections() {
  const current = useCurrentAnalysisType();
  const [open, setOpen] = useState<SectionKey | null>(current ? 'area' : null);
  const areaLabel = useAreaSelectionLabel();
  const analysed = useAtomValue(analysedViewAtom);
  // The report prints the área open, so its map is in the PDF whatever the reader left open.
  const paperLayout = useAtomValue(paperLayoutAtom);
  const toggle = (key: SectionKey) => setOpen((value) => (value === key ? null : key));

  return (
    <>
      <SettingsSection
        name="Tipo de análisis"
        selection={current?.label}
        open={open === 'analysisType'}
        onToggle={() => toggle('analysisType')}
      >
        <div className="flex flex-col gap-6">
          <AnalysisTypeSetting onChoose={() => setOpen(null)} />
          <AnalysisIdentifierSetting />
        </div>
      </SettingsSection>

      {current?.riesgo && (
        <SettingsSection
          name="Área de interés"
          selection={areaLabel}
          open={open === 'area' || paperLayout}
          onToggle={() => toggle('area')}
        >
          <AreaSetting />
        </SettingsSection>
      )}

      {/* Exposición climática works by district: its área is the exposure map, which
          fills the content column until a district is picked, the prompt holding its place. */}
      {current && !current.riesgo && (
        <ExposureArea open={open === 'area'} onToggle={() => toggle('area')} />
      )}

      {/* The filters apply to an analysis: none to set before Analizar. */}
      {current?.riesgo && analysed && (
        <CropDatesSection
          riesgo={current.riesgo}
          open={open === 'cropDates'}
          onToggle={() => toggle('cropDates')}
        />
      )}
    </>
  );
}

function ExposureArea({ open, onToggle }: Readonly<{ open: boolean; onToggle: () => void }>) {
  const district = useAtomValue(selectedDistrictAtom);
  const label = useExposureAreaLabel();

  if (!district) return <DistrictPrompt />;

  return (
    <SettingsSection name="Área de interés" selection={label} open={open} onToggle={onToggle}>
      <ExposureAreaSetting />
    </SettingsSection>
  );
}

/** Its own component: the filter query runs only while the section is on screen. */
function CropDatesSection({
  riesgo,
  open,
  onToggle,
}: Readonly<{ riesgo: Riesgo; open: boolean; onToggle: () => void }>) {
  const label = useCropDatesLabel(riesgo);

  return (
    <SettingsSection name="Cultivo y fechas" selection={label} open={open} onToggle={onToggle}>
      <CropDatesSetting riesgo={riesgo} />
    </SettingsSection>
  );
}
