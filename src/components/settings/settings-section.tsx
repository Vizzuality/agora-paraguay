import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

type SettingsSectionProps = {
  name: string;
  /** The current choice, beside the name while the section is closed. */
  selection?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

/**
 * One setting of the sidebar: a card whose heading names it, with a chevron that turns up
 * while open; closed, the current choice beside the name; open, the controls under it.
 * The sidebar decides which one is open.
 *
 * Opening and closing slide the controls' height (Radix measures it); the card's own
 * padding never changes, so nothing jumps while they do. Closed, the controls unmount
 * once the slide is over.
 */
export function SettingsSection({
  name,
  selection,
  open,
  onToggle,
  children,
}: Readonly<SettingsSectionProps>) {
  return (
    <Collapsible asChild open={open} onOpenChange={onToggle}>
      <section
        aria-label={name}
        className={cn(
          'flex animate-in flex-col rounded-3xl bg-card py-4 backdrop-blur-xs transition-colors fade-in motion-reduce:animate-none',
          !open && 'has-[>button:hover]:bg-secondary-hover',
        )}
      >
        <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-1 px-6 text-left">
          <span className="flex-1 text-base tracking-[0.28px] text-foreground">{name}</span>
          {!open && selection && (
            <span className="animate-in text-xs whitespace-nowrap text-muted-foreground fade-in motion-reduce:animate-none">
              {selection}
            </span>
          )}
          <span
            aria-hidden
            className={cn(
              'flex size-8 items-center justify-center transition-transform duration-200 motion-reduce:transition-none',
              open && 'rotate-180',
            )}
          >
            <ChevronDown className="size-4" />
          </span>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none">
          {/* 10px under the heading and 24px to the card's edge, the card's 16px included. */}
          <div className="flex flex-col gap-6 px-6 pt-2.5 pb-2">{children}</div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}
