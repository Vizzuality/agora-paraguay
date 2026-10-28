import { createFileRoute } from '@tanstack/react-router';

/** Exposición climática has no data yet: the title and a placeholder under the shared nav. */
export const Route = createFileRoute('/analisis/exposicion-climatica')({
  component: ExposicionClimaticaPage,
});

function ExposicionClimaticaPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-4xl font-thin">Exposición climática</h1>
      <p className="text-muted-foreground">Próximamente.</p>
    </div>
  );
}
