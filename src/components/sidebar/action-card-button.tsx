import type { LucideIcon } from 'lucide-react';
import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = ComponentProps<typeof Button> & {
  icon: LucideIcon;
  /** `card`: the panel's icon-over-label tile. `bar`: the phone's 44px row button, no icon. */
  layout?: 'card' | 'bar';
};

/**
 * How a step's group of cards enters: up 16px from transparent, replayed each time a
 * step opens (the group mounts with it). Still for users who ask for reduced motion.
 */
export const ACTION_CARDS_ENTER =
  'animate-in fade-in-0 slide-in-from-bottom-4 duration-500 ease-out motion-reduce:animate-none';

/** The big icon-over-label card the selection panel uses for every action. */
export function ActionCardButton({
  icon: Icon,
  variant = 'secondary',
  layout = 'card',
  className,
  children,
  ...props
}: Readonly<Props>) {
  return (
    <Button
      variant={variant}
      className={cn(
        'border-[3px] font-normal',
        layout === 'card'
          ? 'h-auto flex-col gap-2.5 rounded-3xl p-8'
          : 'h-11 flex-1 rounded-2xl px-8',
        variant === 'default' ? 'border-primary' : 'border-secondary text-accent-foreground',
        className,
      )}
      {...props}
    >
      {layout === 'card' && <Icon aria-hidden className="size-10" strokeWidth={1.5} />}
      {children}
    </Button>
  );
}
