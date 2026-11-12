import { createFileRoute } from '@tanstack/react-router';

/** Riesgo sanitario in the redesign; its content comes with its own ticket. */
export const Route = createFileRoute('/v2/sanitario')({
  component: SanitarioPage,
});

function SanitarioPage() {
  return <h1 className="sr-only">Riesgo sanitario</h1>;
}
