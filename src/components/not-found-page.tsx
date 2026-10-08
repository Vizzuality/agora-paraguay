import { Link } from '@tanstack/react-router';

import { AuthCard } from '@/components/auth/auth-card';
import { Footer } from '@/components/footer';
import { HeaderNav } from '@/components/sidebar/header-nav';
import { NavBar } from '@/components/sidebar/nav-bar';
import { Button } from '@/components/ui/button';
import { CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Where an unknown URL lands (`defaultNotFoundComponent`): the nav and footer as on every
 * page, and one card sending the user back to the selection. Without it the router falls
 * back to a bare "Not Found" paragraph.
 */
export function NotFoundPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <NavBar>
        <HeaderNav />
      </NavBar>

      <main className="flex flex-1 flex-col items-center px-2 pt-6 pb-10 md:px-10 md:pt-10 md:pb-12">
        <AuthCard className="max-w-full">
          <div className="flex flex-col gap-6 py-10">
            <CardHeader className="gap-1.5 px-10">
              <CardTitle className="text-4xl font-semibold tracking-[-0.015em]">
                <h1>Página no encontrada</h1>
              </CardTitle>
              <CardDescription>
                La dirección no corresponde a ninguna página de la plataforma.
              </CardDescription>
            </CardHeader>

            <CardFooter className="px-10">
              <Button asChild className="h-11 w-full rounded-2xl font-normal">
                <Link to="/">Volver al inicio</Link>
              </Button>
            </CardFooter>
          </div>
        </AuthCard>
      </main>

      <Footer />
    </div>
  );
}
