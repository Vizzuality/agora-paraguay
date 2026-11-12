import { useState } from 'react';

import {
  AnalysisTypeSetting,
  useCurrentAnalysisType,
} from '@/components/settings/analysis-type-setting';
import { SettingsSection } from '@/components/settings/settings-section';

type SectionKey = 'tipo';

/** The redesign's settings column: its sections, one open at a time. */
export function SettingsSidebar() {
  const [open, setOpen] = useState<SectionKey | null>(null);
  const current = useCurrentAnalysisType();
  const toggle = (key: SectionKey) => setOpen((value) => (value === key ? null : key));

  return (
    <SettingsSection
      name="Tipo de análisis"
      selection={current?.label}
      open={open === 'tipo'}
      onToggle={() => toggle('tipo')}
    >
      <AnalysisTypeSetting onChoose={() => setOpen(null)} />
    </SettingsSection>
  );
}
