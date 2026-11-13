import { createFileRoute, redirect } from '@tanstack/react-router';

/** `/` opens Riesgo sanitario on its Área de interés, camera kept. */
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/analisis/sanitario', search: true, replace: true });
  },
});
