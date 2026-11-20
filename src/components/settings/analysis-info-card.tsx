import { X } from 'lucide-react';
import { useState } from 'react';

import { useCurrentAnalysisType } from '@/components/settings/analysis-type-setting';
import { SettingCardIcon } from '@/components/settings/setting-card';
import { Button } from '@/components/ui/button';
import { analysisDescription } from '@/lib/analysis-texts';

/**
 * The open analysis type's name and what it is for, under Tipo de análisis. Closing it lasts
 * until the type changes: keyed by type, so each switch or new visit shows it again.
 */
export function AnalysisInfoCard() {
  const current = useCurrentAnalysisType();
  const text = current && analysisDescription(String(current.to));
  if (!current || !text) return null;

  return <InfoCard key={current.label} {...current} text={text} />;
}

function InfoCard({
  label,
  icon,
  text,
}: Readonly<
  Pick<NonNullable<ReturnType<typeof useCurrentAnalysisType>>, 'label' | 'icon'> & { text: string }
>) {
  const [closed, setClosed] = useState(false);
  if (closed) return null;

  return (
    <section
      aria-label={`Acerca de ${label}`}
      className="relative flex items-start gap-6 rounded-3xl border-3 border-border py-8 pr-4 pl-6"
    >
      <SettingCardIcon icon={icon} />
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        {/* Not a heading: the region already names the card, and the page's h2s are its sections. */}
        <p className="text-base leading-[20.3px] tracking-[0.28px] text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Cerrar"
        className="absolute top-0 right-0 size-12 rounded-3xl hover:bg-transparent dark:hover:bg-transparent"
        onClick={() => setClosed(true)}
      >
        <X />
      </Button>
    </section>
  );
}
