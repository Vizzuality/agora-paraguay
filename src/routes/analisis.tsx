import { ClientOnly, createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';

import { Footer } from '@/components/footer';
import { Logo } from '@/components/logo';
import { HeaderNav, PhoneAnalysisNav } from '@/components/sidebar/header-nav';
import { NavBar } from '@/components/sidebar/nav-bar';
import { useNarrowScreen } from '@/lib/use-narrow-screen';
import { useSavedSelection } from '@/lib/use-saved-selection';
import { analysedParcelIdsAtom } from '@/store/analysis';
import { savedSelectionHydratedAtom } from '@/store/saved-selection';

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
      {/* The report (the page printed) carries the brand where the nav and footer were. */}
      <ReportBrand />

      <main className="flex flex-1 flex-col gap-6 px-2 pt-6 pb-10 md:px-10 md:pt-10 md:pb-12 print:p-0">
        <Outlet />
      </main>

      <ReportBrand />
      <Footer />
    </div>
  );
}

/**
 * A hard reload starts a fresh module store, so the saved selection is read here too:
 * the analysed parcels come back and the page shows the same analysis. Only once that
 * read is done, with still no parcels (nothing saved, expired, or a direct visit), is
 * the user sent back to build a selection.
 */
function EmptySelectionRedirect() {
  useSavedSelection();

  const parcelIds = useAtomValue(analysedParcelIdsAtom);
  const hydrated = useAtomValue(savedSelectionHydratedAtom);
  const navigate = useNavigate();
  const empty = hydrated && parcelIds.length === 0;

  useEffect(() => {
    if (empty) void navigate({ to: '/', replace: true });
  }, [empty, navigate]);

  return null;
}

/** Print only: the logo at the top and the bottom of the report. */
function ReportBrand() {
  return (
    <div className="hidden px-2 py-6 md:px-10 print:block print:px-0">
      <Logo className="h-[30px] w-auto text-primary" />
    </div>
  );
}
