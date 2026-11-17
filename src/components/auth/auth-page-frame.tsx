import type { ReactNode } from 'react';

import { PageFrame } from '@/components/frame/page-frame';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

/** An auth card filling the settings column's width. */
export const AUTH_PAGE_CARD_CLASS = 'md:w-full md:shrink';

/**
 * The auth pages' layout, the analysis pages' frame: the card heads the settings column
 * over an empty frame, and the content column is one empty frame.
 */
export function AuthPageFrame({
  title,
  children,
}: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <PageFrame
      settings={
        <>
          {children}
          <EmptyFrame className="min-h-44" />
        </>
      }
    >
      <h1 className="sr-only">{title}</h1>
      <EmptyFrame className="min-h-108" />
    </PageFrame>
  );
}

/** A spinner in the card's place: before hydration, or while a link is being checked. */
export function AuthCardPending() {
  return (
    <div className="flex min-h-72 items-center justify-center rounded-3xl bg-card" aria-busy>
      <Spinner />
    </div>
  );
}

/** An empty widget frame, as the design leaves the page around the card. */
function EmptyFrame({ className }: Readonly<{ className?: string }>) {
  return (
    <div
      aria-hidden
      className={cn('flex-1 rounded-3xl border-3 border-border backdrop-blur-xs', className)}
    />
  );
}
