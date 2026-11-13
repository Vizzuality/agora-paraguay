import type { ReactNode } from 'react';

import { Footer } from '@/components/footer';
import { TopBar } from '@/components/frame/top-bar';

/**
 * The redesign's page frame: the top bar and the settings on the left, the content on
 * the right, the footer below. From `lg` the left column stays in view while the
 * content scrolls; one taller than the window scrolls on its own. Below `lg` the
 * columns stack, settings first.
 */
export function PageFrame({
  settings,
  children,
}: Readonly<{ settings?: ReactNode; children: ReactNode }>) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex flex-1 flex-col gap-4 px-2 md:px-10 lg:flex-row">
        {/* A plain div, not the aside: a header inside an aside loses its banner role. */}
        <div className="flex shrink-0 flex-col gap-4 bg-background pt-2 md:pt-10 lg:sticky lg:top-0 lg:max-h-dvh lg:w-138 lg:self-start lg:overflow-y-auto lg:pb-10">
          <TopBar />
          <aside aria-label="Configuración" className="flex flex-col gap-4">
            {settings}
          </aside>
        </div>

        <main className="flex min-w-0 flex-1 flex-col gap-4 pb-10 lg:pt-10">{children}</main>
      </div>

      <Footer />
    </div>
  );
}
