import { createFileRoute } from '@tanstack/react-router';

/** Riesgo productivo in the redesign; its content comes with its own ticket. */
export const Route = createFileRoute('/v2/productivo')({
  component: ProductivoPage,
});

function ProductivoPage() {
  return <h1 className="sr-only">Riesgo productivo</h1>;
}
