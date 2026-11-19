import { createFileRoute, redirect } from '@tanstack/react-router';

/** Bare `/analisis` has no page of its own: send it to the first screen. */
export const Route = createFileRoute('/analisis/')({
  beforeLoad: () => {
    throw redirect({ to: '/analisis/exposicion-climatica', replace: true });
  },
});
