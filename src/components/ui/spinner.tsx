import { Loader2Icon } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * shadcn's spinner, minus its `role="status"`: an svg cannot be the semantic `<output>`
 * the a11y lint asks for, so the glyph is decorative and the caller wraps it in an
 * `<output>` with the visible message (see `MiniMapThumbnail`).
 */
function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return <Loader2Icon aria-hidden className={cn('size-4 animate-spin', className)} {...props} />;
}

export { Spinner };
