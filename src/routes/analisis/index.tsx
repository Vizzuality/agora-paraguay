import { createFileRoute, redirect } from '@tanstack/react-router';

/** Bare `/analisis` has no page of its own: send it to the public tab. */
export const Route = createFileRoute('/analisis/')({
  beforeLoad: () => {
    throw redirect({ to: '/analisis/sanitario', replace: true });
  },
});
