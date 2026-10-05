import { cn } from '@/lib/utils';

export function Logo({ className }: Readonly<{ className?: string }>) {
  return (
    <span className={cn('flex items-center text-2xl font-bold tracking-wide', className)}>
      LOGO
    </span>
  );
}
