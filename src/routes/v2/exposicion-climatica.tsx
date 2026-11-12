import { createFileRoute } from '@tanstack/react-router';

/** Exposición climática in the redesign; its content comes with its own ticket. */
export const Route = createFileRoute('/v2/exposicion-climatica')({
  component: ExposicionPage,
});

function ExposicionPage() {
  return <h1 className="sr-only">Exposición climática</h1>;
}
