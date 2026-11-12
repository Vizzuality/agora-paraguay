import { createFileRoute, Outlet } from '@tanstack/react-router';

import { PageFrame } from '@/components/frame/page-frame';
import { SettingsSidebar } from '@/components/settings/settings-sidebar';

/**
 * The redesign, unlinked until the cut-over (AGP-120): the page frame with the settings
 * on the left and the analysis type's page, one route per type, on the right.
 */
export const Route = createFileRoute('/v2')({
  component: RedesignLayout,
});

function RedesignLayout() {
  return (
    <PageFrame settings={<SettingsSidebar />}>
      <Outlet />
    </PageFrame>
  );
}
