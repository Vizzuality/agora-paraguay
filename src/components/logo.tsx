import { cn } from '@/lib/utils';

// Placeholder wordmark (AGP-35): the platform name is not decided yet and "Ágora"
// cannot be used, so a plain "LOGO" text stands in until the brand lands. Inherits
// color from CSS, so size and color it from the call site like the old SVG mark.
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center text-2xl font-bold tracking-wide', className)}>
      LOGO
    </span>
  );
}
