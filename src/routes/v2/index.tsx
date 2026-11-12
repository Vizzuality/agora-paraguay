import { createFileRoute } from '@tanstack/react-router';

import { PageFrame } from '@/components/frame/page-frame';

/**
 * Entry of the redesign, unlinked until the cut-over: the page frame alone. The settings
 * and the analysis pages fill it ticket by ticket.
 */
export const Route = createFileRoute('/v2/')({
  component: RedesignPage,
});

function RedesignPage() {
  return <PageFrame>{null}</PageFrame>;
}
