import type { LucideIcon } from 'lucide-react';
import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = ComponentProps<typeof Button> & { icon: LucideIcon };

/** The big icon-over-label card the selection panel uses for every action (Figma 7172:1593). */
export function ActionCardButton({
  icon: Icon,
  variant = 'secondary',
  className,
  children,
  ...props
}: Props) {
  return (
    <Button
      variant={variant}
      className={cn(
        'h-auto flex-col gap-2.5 rounded-3xl border-[3px] p-8 font-normal',
        variant === 'default' ? 'border-primary' : 'border-secondary text-accent-foreground',
        className,
      )}
      {...props}
    >
      <Icon aria-hidden className="size-10" strokeWidth={1.5} />
      {children}
    </Button>
  );
}
