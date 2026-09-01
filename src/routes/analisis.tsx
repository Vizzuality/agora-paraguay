import {
  ClientOnly,
  createFileRoute,
  useNavigate,
  type SearchSchemaInput,
} from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { SquarePen, Upload } from 'lucide-react';
import { useEffect } from 'react';

import { AnalysisHero } from '@/components/analysis-hero';
import { Footer } from '@/components/footer';
import { LoginCard } from '@/components/login-card';
import { HeaderNav } from '@/components/sidebar/header-nav';
import { NavBar } from '@/components/sidebar/nav-bar';
import { SelectedAreasList } from '@/components/sidebar/selected-areas-list';
import { Button } from '@/components/ui/button';
import { polygonName } from '@/lib/map/draw-features';
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
        <HeaderNav />
      </NavBar>

      <main className="flex flex-1 flex-col gap-6 px-10 pt-10 pb-12">
        {/* Sanitario is public; productivo shows the hero and title only with a
            session (the login screen design has neither above the gate). */}
        <ClientOnly>
          {riesgo === 'sanitario' ? (
            <>
              <SelectionHero riesgo="sanitario" />
              <TitleRow riesgo="sanitario" />
            </>
          ) : (
            <ProductivoHero />
          )}
        </ClientOnly>

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

/** The hero with the parcel tabs filled from the submitted selection. */
function SelectionHero({ riesgo }: Readonly<{ riesgo: RiesgoTab }>) {
  const polygons = useAtomValue(drawPolygonsAtom);
  const selectedParcels = useAtomValue(selectedParcelsAtom);

  const parcels = [...polygons, ...selectedParcels].map((area, index) => polygonName(area, index));

  return <AnalysisHero riesgo={riesgo} parcels={parcels} />;
}

function TitleRow({ riesgo }: Readonly<{ riesgo: RiesgoTab }>) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-[66px] font-thin tracking-[0.408px]">
        {riesgo === 'sanitario' ? 'Riesgo sanitario' : 'Riesgo productivo'}
      </h1>

      <div className="flex items-center gap-4">
        <Button variant="secondary" className="h-11 rounded-2xl px-8 font-normal">
          <SquarePen aria-hidden />
          Personalizar indicadores
        </Button>
        <Button className="h-11 rounded-2xl px-8 font-normal">
          <Upload aria-hidden />
          Exportar informe
        </Button>
      </div>
    </div>
  );
}

/** Hero for the private tab: only a logged-in analyst sees the parameters. */
function ProductivoHero() {
  const session = useAtomValue(sessionAtom);

  if (!session) return null;

  return (
    <>
      <SelectionHero riesgo="productivo" />
      <TitleRow riesgo="productivo" />
    </>
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
