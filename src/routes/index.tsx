import { createFileRoute, redirect } from '@tanstack/react-router';

/** `/` opens the first screen: Exposición climática, no district picked. */
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/analisis/exposicion-climatica', replace: true });
  },
});
