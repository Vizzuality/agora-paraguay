import {
  ClientOnly,
  createFileRoute,
  useNavigate,
  type SearchSchemaInput,
} from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';

import { Footer } from '@/components/footer';
import { LoginCard } from '@/components/login-card';
import { AnalysisNav } from '@/components/sidebar/analysis-nav';
import { NavBar } from '@/components/sidebar/nav-bar';
import { SelectedAreasList } from '@/components/sidebar/selected-areas-list';
import { sessionAtom } from '@/store/auth';
import { drawPolygonsAtom } from '@/store/draw';
import { selectedParcelsAtom } from '@/store/parcels';

/** The analysis tabs. URL state, not store state: a shared link lands on the same tab. */
export type RiesgoTab = 'sanitario' | 'productivo';

export const Route = createFileRoute('/analisis')({
  // `SearchSchemaInput` keeps the param optional for links and navigate calls
  // (`analyze-button.tsx` navigates here without one); anything unknown falls back
  // to the default tab instead of leaking into the page.
  validateSearch: (search: { riesgo?: string } & SearchSchemaInput): { riesgo: RiesgoTab } => ({
    riesgo: search.riesgo === 'productivo' ? 'productivo' : 'sanitario',
  }),
  component: AnalysisPage,
});

/** Placeholder for the analysis results page — content arrives with the real API. */
function AnalysisPage() {
  const { riesgo } = Route.useSearch();

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

      <NavBar>
        <AnalysisNav />
      </NavBar>

      <main className="flex flex-1 flex-col gap-6 px-10 pt-10 pb-12">
        <h1 className="text-4xl font-semibold tracking-[-0.015em]">Análisis</h1>

        {/* Riesgo sanitario is public; riesgo productivo is private and shows the
            designed login gate (Figma node 5180:11125) until a session exists. The
            gate reads the session atom, so it is client-only like every other atom
            consumer — the server fallback is the gate itself, which is also what an
            anonymous visitor sees, so there is no hydration flash for them. */}
        {riesgo === 'sanitario' ? (
          <WidgetGrid />
        ) : (
          <ClientOnly fallback={<LoginGate />}>
            <ProductivoGate />
          </ClientOnly>
        )}

        <ClientOnly>
          <SelectedAreasList />
        </ClientOnly>
      </main>

      <Footer />
    </div>
  );
}

/** Riesgo productivo needs an account: login gate until a session exists. */
function ProductivoGate() {
  const session = useAtomValue(sessionAtom);

  return session ? <WidgetGrid /> : <LoginGate />;
}

/** The private-content gate: empty widget frames around the login card. */
function LoginGate() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-stretch gap-4">
        <WidgetPlaceholder />
        <LoginCard />
        <WidgetPlaceholder />
      </div>
      <div className="flex h-28 gap-4">
        <WidgetPlaceholder />
        <WidgetPlaceholder />
      </div>
    </div>
  );
}

/** The indicators layout, minus the gate — real widgets take the slots with the API. */
function WidgetGrid() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-64 items-stretch gap-4">
        <WidgetPlaceholder />
        <WidgetPlaceholder />
        <WidgetPlaceholder />
      </div>
      <div className="flex h-28 gap-4">
        <WidgetPlaceholder />
        <WidgetPlaceholder />
      </div>
    </div>
  );
}

/** Empty widget frame (Figma "Widget03") — a real widget takes the slot with the API. */
function WidgetPlaceholder() {
  return <div aria-hidden className="min-w-[200px] flex-1 rounded-3xl border-3 border-border" />;
}

/**
 * A hard reload or a direct visit starts a fresh module store: selection mode, zero
 * areas — a blank analysis page. Send the user back to build a selection instead.
 */
function EmptySelectionRedirect() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const selectedParcels = useAtomValue(selectedParcelsAtom);
  const navigate = useNavigate();
  const empty = polygons.length === 0 && selectedParcels.length === 0;

  useEffect(() => {
    if (empty) void navigate({ to: '/', replace: true });
  }, [empty, navigate]);

  return null;
}
