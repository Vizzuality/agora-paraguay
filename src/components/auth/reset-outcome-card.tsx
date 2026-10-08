import { Link } from '@tanstack/react-router';

import { AuthCard } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * The end of the reset flow, either way: the password was updated, or
 * the link is no good — expired, spent, or not a link the backend issued. Both hand the
 * user back to the map, where the header opens the login.
 */
export function ResetOutcomeCard({
  outcome,
  className,
}: Readonly<{ outcome: 'updated' | 'invalid-link'; className?: string }>) {
  const copy =
    outcome === 'updated'
      ? {
          title: 'Contraseña actualizada',
          description: 'Ya puede iniciar sesión con su nueva contraseña',
          action: 'Iniciar sesión',
        }
      : {
          title: 'Enlace no válido',
          description:
            'El enlace ha caducado o ya se ha utilizado. Solicite uno nuevo desde la pantalla de acceso.',
          action: 'Volver al inicio',
        };

  return (
    <AuthCard className={className}>
      <div className="flex flex-col gap-6 py-10">
        <CardHeader className="gap-1.5 px-10">
          <CardTitle className="text-4xl font-semibold tracking-[-0.015em]">
            <h2>{copy.title}</h2>
          </CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>

        <CardFooter className="px-10">
          <Button asChild className="h-11 w-full rounded-2xl font-normal">
            <Link to="/">{copy.action}</Link>
          </Button>
        </CardFooter>
      </div>
    </AuthCard>
  );
}
