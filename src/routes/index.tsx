import { useQuery } from '@tanstack/react-query';
import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, type ReactNode } from 'react';

import { LoginDialog, UserButton } from '@/components/auth/login-dialog';
import { MapView } from '@/components/map';
import { MapLoading } from '@/components/map/map-loading';
import { NavBar } from '@/components/sidebar/nav-bar';
import { SelectionBar } from '@/components/sidebar/selection-bar';
import { SelectionBlock, SelectionBlockLayout } from '@/components/sidebar/selection-block';
import { ThemeToggle, ThemeTogglePlaceholder } from '@/components/theme-toggle';
import { parcelQueries } from '@/lib/api/parcels/queries';
import { useNarrowScreen } from '@/lib/use-narrow-screen';
import { cn } from '@/lib/utils';
import { drawPolygonsAtom } from '@/store/draw';
import { backToSelectionAtom } from '@/store/mode';
import { selectionViewAtom } from '@/store/selection';

export const Route = createFileRoute('/')({
  component: SelectionPage,
});

/**
 * The parcel selection: the panel (Figma 7172:1758) beside the map on a wide screen;
 * on a phone the two take turns (`selectionView`), the panel first (mobile01), then
 * the map with the actions in a bar under it (mobile02, mobile03). The server and the
 * first paint render the panel view; the live layout takes over once the atoms do.
 */
function SelectionPage() {
  return (
    <main className="relative flex h-dvh w-full flex-col md:flex-row">
      <ClientOnly
        fallback={
          <Layout
            nav={<PhoneNavPlaceholder />}
            panel={<SelectionBlockLayout step={1} />}
            map={<div className="h-full w-full bg-muted" />}
          />
        }
      >
        {/* Client-only like every other atom consumer (see draw-core.ts). */}
        <ResumeSelectionMode />
        <LiveLayout />
      </ClientOnly>
    </main>
  );
}

/** The layout once the atoms are readable: which view a phone is on, and the phone-only pieces. */
function LiveLayout() {
  const narrow = useNarrowScreen();
  const view = useAtomValue(selectionViewAtom);
  const mapView = narrow && view === 'map';

  return (
    <Layout
      mapView={mapView}
      nav={narrow && <PhoneNav />}
      panel={!mapView && <SelectionBlock />}
      bar={mapView && <SelectionBar />}
      map={
        <>
          {/* MapLibre touches window and document at import time, so it must never run
              during SSR. It mounts under the panel on a phone, full size, so the camera
              fit on an upload is computed against a real viewport. */}
          <MapView />
          <ParcelsLookup />
        </>
      }
    />
  );
}

/**
 * The two columns, or on a phone the panel over the map until `mapView`, then the
 * map between the nav bar and the actions bar. The map pane keeps its size while
 * covered: MapLibre must not initialise or fit the camera in a zero-size box.
 */
function Layout({
  mapView = false,
  nav,
  panel,
  map,
  bar,
}: Readonly<{
  mapView?: boolean;
  nav?: ReactNode;
  panel?: ReactNode;
  map: ReactNode;
  bar?: ReactNode;
}>) {
  return (
    <>
      <aside
        className={cn(
          'flex flex-col bg-background md:h-full md:w-1/2 md:overflow-y-auto',
          mapView
            ? 'shrink-0'
            : 'max-md:absolute max-md:inset-0 max-md:z-10 max-md:overflow-y-auto',
        )}
      >
        <NavBar>{nav}</NavBar>
        {panel}
      </aside>

      <div
        className={cn(
          'relative min-h-0 flex-1 md:h-full md:w-1/2 md:flex-none',
          !mapView && 'max-md:invisible',
        )}
      >
        {map}
      </div>

      {bar}
    </>
  );
}

/** The phone nav bar's right side (Figma 5655:5511): theme switch and account. */
function PhoneNav() {
  return (
    <>
      <ThemeToggle />
      <LoginDialog />
    </>
  );
}

/** Same footprint before hydration, so the phone's bar does not shift when the real one mounts. */
function PhoneNavPlaceholder() {
  return (
    <div className="contents md:hidden">
      <ThemeTogglePlaceholder />
      <UserButton disabled />
    </div>
  );
}

/** Veils the map while `filter-parcels` looks up the parcels for the areas just landed. */
function ParcelsLookup() {
  const polygons = useAtomValue(drawPolygonsAtom);
  const { isFetching } = useQuery(parcelQueries.filtered(polygons));

  return isFetching ? <MapLoading>Buscando parcelas…</MapLoading> : null;
}

/** Returning to `/` resumes selection: the surviving areas are editable again. */
function ResumeSelectionMode() {
  const backToSelection = useSetAtom(backToSelectionAtom);

  useEffect(() => backToSelection(), [backToSelection]);

  return null;
}
