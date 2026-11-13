import { ClientOnly, createFileRoute, Outlet } from '@tanstack/react-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';

import { PageFrame } from '@/components/frame/page-frame';
import { SettingsSidebar } from '@/components/settings/settings-sidebar';
import { useSavedSelection } from '@/lib/use-saved-selection';
import { resumeAnalysisAtom } from '@/store/mode';
import { savedSelectionHydratedAtom } from '@/store/saved-selection';

/**
 * The analysis pages: the page frame with the settings on the left and the analysis
 * type's page, one route per type, on the right.
 */
export const Route = createFileRoute('/analisis')({
  component: RedesignLayout,
});

function RedesignLayout() {
  return (
    <PageFrame
      settings={
        <ClientOnly>
          <PersistSelection />
          <SettingsSidebar />
        </ClientOnly>
      }
    >
      <Outlet />
    </PageFrame>
  );
}

/**
 * The selection survives a reload, saved on every change; an analysed one comes back
 * analysed, once the saved record has been read. Once per visit: Editar parcelas after
 * that stays in the selection.
 */
function PersistSelection() {
  useSavedSelection();

  const hydrated = useAtomValue(savedSelectionHydratedAtom);
  const resume = useSetAtom(resumeAnalysisAtom);

  useEffect(() => {
    if (hydrated) resume();
  }, [hydrated, resume]);

  return null;
}
