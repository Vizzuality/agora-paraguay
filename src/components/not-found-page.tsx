import { Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';

/**
 * Where an unknown URL lands (`defaultNotFoundComponent`): the page alone, centred, with
 * the way back to the selection. Without it the router falls back to a bare "Not Found"
 * paragraph.
 */
export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="text-7xl font-light tracking-[-0.015em] text-muted-foreground">404</p>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-4xl font-semibold tracking-[-0.015em]">Página no encontrada</h1>
        <p className="text-muted-foreground">
          La dirección no corresponde a ninguna página de la plataforma.
        </p>
      </div>
      <Button asChild className="h-11 rounded-2xl px-8 font-normal">
        <Link to="/">Volver al inicio</Link>
      </Button>
    </main>
  );
}
