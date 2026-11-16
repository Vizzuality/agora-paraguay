import { ChevronDown } from 'lucide-react';
import { useId, type ReactNode } from 'react';

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
 * One setting of the sidebar: a card whose heading names it and, closed, shows the
 * current choice and a chevron; open, the controls under it. The sidebar decides which
 * one is open.
 */
export function SettingsSection({
  name,
  selection,
  open,
  onToggle,
  children,
}: Readonly<SettingsSectionProps>) {
  const id = useId();

  return (
    <section
      aria-label={name}
      className={cn(
        'flex flex-col rounded-3xl bg-card backdrop-blur-xs transition-colors',
        open ? 'gap-2.5 pt-4' : 'py-4 has-[>button:hover]:bg-secondary-hover',
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-1 px-6 text-left"
      >
        <span className="flex-1 text-base tracking-[0.28px] text-foreground">{name}</span>
        {!open && selection && (
          <span className="text-xs whitespace-nowrap text-muted-foreground">{selection}</span>
        )}
        <span
          aria-hidden
          className={cn('flex size-8 items-center justify-center', open && 'invisible')}
        >
          <ChevronDown className="size-4" />
        </span>
      </button>

      {open && (
        <div id={id} className="flex flex-col gap-6 px-6 pb-6">
          {children}
        </div>
      )}
    </section>
  );
}
