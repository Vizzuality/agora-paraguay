import { useAtomValue, useSetAtom } from 'jotai';
import { X } from 'lucide-react';

import { useCurrentAnalysisType } from '@/components/settings/analysis-type-setting';
import { SettingCardIcon } from '@/components/settings/setting-card';
import { Button } from '@/components/ui/button';
import { analysisDescription } from '@/lib/analysis-texts';
import { dismissAnalysisInfoAtom, dismissedAnalysisInfoAtom } from '@/store/analysis-info';

/**
 * The open analysis type's name and what it is for, under Tipo de análisis, until the user
 * closes it; closed, it stays closed. Reads atoms: render inside `<ClientOnly>`.
 */
export function AnalysisInfoCard() {
  const current = useCurrentAnalysisType();
  const dismissed = useAtomValue(dismissedAnalysisInfoAtom);
  const dismiss = useSetAtom(dismissAnalysisInfoAtom);

  const text = current && analysisDescription(String(current.to));
  if (!current || !text || dismissed.includes(current.label)) return null;

  return (
    <section
      aria-label={`Acerca de ${current.label}`}
      className="relative flex items-start gap-6 rounded-3xl border-3 border-border py-8 pr-4 pl-6"
    >
      <SettingCardIcon icon={current.icon} />
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        {/* Not a heading: the region already names the card, and the page's h2s are its sections. */}
        <p className="text-base leading-[20.3px] tracking-[0.28px] text-foreground">
          {current.label}
        </p>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Cerrar"
        className="absolute top-0 right-0 size-12 rounded-3xl"
        onClick={() => dismiss(current.label)}
      >
        <X />
      </Button>
    </section>
  );
}
