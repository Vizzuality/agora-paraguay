import type { LucideIcon } from 'lucide-react';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/**
 * The settings' option card: icon over label on the secondary fill. `active` outlines
 * the chosen or armed one in primary; `primary` fills it (Analizar).
 */
export function settingCardClass({
  active = false,
  primary = false,
}: { active?: boolean; primary?: boolean } = {}) {
  return cn(
    'flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl p-8 text-center text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 max-md:flex-row max-md:p-4',
    primary
      ? 'border border-primary bg-primary text-primary-foreground hover:bg-primary-hover'
      : 'bg-secondary hover:bg-secondary-hover',
    !primary &&
      (active ? 'border-3 border-primary text-primary' : 'border border-border text-primary'),
  );
}

export function SettingCardIcon({ icon: Icon }: Readonly<{ icon: LucideIcon }>) {
  return <Icon aria-hidden className="size-10 shrink-0 max-md:size-6" strokeWidth={1.5} />;
}

type SettingCardButtonProps = ComponentProps<'button'> & {
  icon: LucideIcon;
  active?: boolean;
  primary?: boolean;
};

export function SettingCardButton({
  icon,
  active,
  primary,
  className,
  children,
  ...props
}: Readonly<SettingCardButtonProps>) {
  return (
    <button
      type="button"
      className={cn(settingCardClass({ active, primary }), className)}
      {...props}
    >
      <SettingCardIcon icon={icon} />
      {children}
    </button>
  );
}
