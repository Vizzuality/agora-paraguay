import { createFileRoute, redirect } from '@tanstack/react-router';

/** The redesign is the app: `/` opens Riesgo sanitario on its Área de interés, camera kept. */
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/v2/sanitario', search: true, replace: true });
  },
});
