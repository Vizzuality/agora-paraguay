import { createFileRoute, redirect } from '@tanstack/react-router';

/** Bare `/v2` has no page of its own: send it to the public type, as `/analisis` does. */
export const Route = createFileRoute('/v2/')({
  beforeLoad: () => {
    throw redirect({ to: '/v2/sanitario', replace: true });
  },
});
