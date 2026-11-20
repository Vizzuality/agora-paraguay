import { useAtomValue } from 'jotai';
import { type LucideIcon, Map as MapIcon, MapPin } from 'lucide-react';

import { RichParagraph } from '@/components/rich-paragraph';
import { SettingCardIcon } from '@/components/settings/setting-card';
import { ANALYSIS_TEXTS } from '@/lib/analysis-texts';
import { exposureMapViewAtom } from '@/store/exposure';

const { pickDistrict, readMap } = ANALYSIS_TEXTS.exposureIntro;

/**
 * What Exposición climática asks for and how to read its map, holding the settings column
 * until a district is picked. The reading follows the map's open view. Reads atoms: render
 * inside `<ClientOnly>`.
 */
export function ExposureIntro() {
  const view = useAtomValue(exposureMapViewAtom);

  return (
    <section aria-label="Cómo empezar" className="flex flex-col">
      <IntroPanel icon={MapPin} title={pickDistrict.title} body={pickDistrict.body} />
      {/* Indented to the text column: past the panel's padding, icon and gap. */}
      <hr className="mr-6 ml-22 border-t-3 border-border" />
      <IntroPanel icon={MapIcon} title={readMap.title} body={readMap.body[view]} />
    </section>
  );
}

function IntroPanel({
  icon,
  title,
  body,
}: Readonly<{ icon: LucideIcon; title: string; body: string[] }>) {
  return (
    <div className="flex items-start gap-6 px-6 py-8">
      <SettingCardIcon icon={icon} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="text-base leading-[20.3px] tracking-[0.28px] text-foreground">{title}</h2>
        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
          {body.map((paragraph) => (
            <RichParagraph key={paragraph} text={paragraph} />
          ))}
        </div>
      </div>
    </div>
  );
}
