import { createFileRoute, redirect } from '@tanstack/react-router';

import { ANALYSIS_TYPES } from '@/lib/nav-links';

/** Old `/analisis/*` links land on the same analysis type in the redesign, else on sanitario. */
export const Route = createFileRoute('/analisis/$')({
  beforeLoad: ({ params }) => {
    const type = params._splat?.replace(/\/$/, '');
    const target = ANALYSIS_TYPES.find(({ to }) => to === `/v2/${type}`);

    throw redirect({ to: target?.to ?? '/v2/sanitario', search: true, replace: true });
  },
});
