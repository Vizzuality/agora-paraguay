import type { ReactNode } from 'react';

import { TopBar } from '@/components/frame/top-bar';

/**
 * The redesign's page frame: the top bar and the settings on the left, the content on
 * the right. From `lg` the two columns split the width in halves; they
 * stop growing at 1440px and centre beyond it. The left column stays in view while the
 * content scrolls; one taller than the window scrolls on its own. The column stretches
 * to the row, up to the window, so a setting can fill it to the bottom.
 * Below `lg` the columns stack, settings first.
 *
 * The report stacks them too, in print and in the paper layout before it (`printReport`):
 * the paper layout keeps the screen's breakpoints, so without its own classes the content
 * column would sit squeezed beside the settings, and the charts measure that width.
 */
export function PageFrame({
  settings,
  settingsLabel = 'Configuración',
  children,
}: Readonly<{ settings?: ReactNode; settingsLabel?: string; children: ReactNode }>) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="mx-auto flex w-full max-w-360 flex-1 flex-col gap-4 px-2 md:px-10 lg:flex-row print:flex-col print:px-0 paper:flex-col paper:px-0">
        {/* A plain div, not the aside: a header inside an aside loses its banner role. */}
        <div className="flex shrink-0 flex-col gap-4 bg-background pt-2 md:pt-10 lg:sticky lg:top-0 lg:max-h-dvh lg:min-w-0 lg:flex-1 lg:overflow-y-auto lg:pb-10 print:static print:max-h-none print:w-auto print:flex-none print:self-auto print:overflow-visible print:pt-0 print:pb-0 paper:static paper:max-h-none paper:w-auto paper:flex-none paper:self-auto paper:overflow-visible paper:pt-0 paper:pb-0">
          <TopBar />
          <aside aria-label={settingsLabel} className="flex flex-1 flex-col gap-4">
            {settings}
          </aside>
        </div>

        <main className="flex min-w-0 flex-1 flex-col gap-4 pb-10 lg:pt-10 print:pt-0 paper:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
