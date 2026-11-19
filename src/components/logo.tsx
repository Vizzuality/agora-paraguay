import logoUrl from '@/assets/agora-logo.svg';
import { cn } from '@/lib/utils';

/**
 * AGORA's wordmark, painted in the text colour: the SVG is a mask over `bg-current`, so it
 * reads navy on the bars and light on the footer. Size it by height; the width follows.
 */
export function Logo({ className }: Readonly<{ className?: string }>) {
  return (
    <span
      className={cn('block aspect-[153.335/30] bg-current', className)}
      style={{
        // Quoted: Vite inlines a small SVG as a data URL with spaces and single quotes.
        maskImage: `url("${logoUrl}")`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
      }}
    >
      <span className="sr-only">AGORA</span>
    </span>
  );
}
