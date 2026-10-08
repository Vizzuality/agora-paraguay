import { ClientOnly, createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';

import { Footer } from '@/components/footer';
import { HeaderNav, PhoneAnalysisNav } from '@/components/sidebar/header-nav';
import { NavBar } from '@/components/sidebar/nav-bar';
import { useNarrowScreen } from '@/lib/use-narrow-screen';
import { drawPolygonsAtom } from '@/store/draw';

/**
 * Layout of the analysis pages: the nav with the risk tabs, the footer, and the guard
 * that sends an empty selection back to `/`. Each riesgo is a child route
 * (`/analisis/sanitario`, `/analisis/productivo`) rendered in the outlet, so a shared
 * link lands on the same tab and the two pages grow apart without branching here.
 */
export const Route = createFileRoute('/analisis')({
  component: AnalysisLayout,
});

function AnalysisLayout() {
  const narrow = useNarrowScreen();

  return (
    // The nav and footer live outside <main> on purpose: header/footer only get
    // their banner/contentinfo landmark roles when they are not descendants of
    // <main> — the e2e locators rely on those roles.
    <div className="flex min-h-screen w-full flex-col">
      {/* Client-only like every other atom consumer (see draw-core.ts); a router
          `beforeLoad` guard is not an option — it runs on the server, where the
          shared module store must stay untouched. */}
      <ClientOnly>
        <EmptySelectionRedirect />
      </ClientOnly>

      <NavBar below={narrow && <PhoneAnalysisNav />}>
        <HeaderNav compact={narrow} />
      </NavBar>

      <main className="flex flex-1 flex-col gap-6 px-2 pt-6 pb-10 md:px-10 md:pt-10 md:pb-12">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

/**
 * A hard reload or a direct visit starts a fresh module store: selection mode, zero
 * areas — a blank analysis page. Send the user back to build a selection instead.
 */
function EmptySelectionRedirect() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const navigate = useNavigate();
  const empty = polygons.length === 0;

  useEffect(() => {
    if (empty) void navigate({ to: '/', replace: true });
  }, [empty, navigate]);

  return null;
}
