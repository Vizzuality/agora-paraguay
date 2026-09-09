import { useMutation } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { useId } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoginError } from '@/lib/api/client';
import { authMutations } from '@/lib/api/queries';
import { cn } from '@/lib/utils';
import { sessionAtom } from '@/store/auth';

/**
 * Submits the credentials to the Django login (`authMutations.login`) and stores the
 * resulting session in `sessionAtom`. The real session is Django's HttpOnly cookie,
 * which the browser sends on its own but scripts cannot read, so the atom is the UI's
 * only record of who is signed in: the header dialog and the riesgo productivo tab
 * read it to swap the login gate for the identified state.
 */
export function LoginCard({
  className,
  onSuccess,
}: Readonly<{ className?: string; onSuccess?: () => void }>) {
  const setSession = useSetAtom(sessionAtom);

  const fieldId = useId();
  const mutation = useMutation({
    ...authMutations.login(),
    onSuccess: (session) => {
      setSession(session);
      onSuccess?.();
    },
  });

  return (
    <Card
      className={cn('w-[411px] shrink-0 gap-0 rounded-3xl border-0 py-0 shadow-none', className)}
    >
      <form
        className="flex flex-col gap-6 py-10"
        onSubmit={(event) => {
          event.preventDefault();

          const data = new FormData(event.currentTarget);
          // `FormData.get` may hand back a `File`; only text inputs live in this form.
          const text = (name: string) => {
            const value = data.get(name);

            return typeof value === 'string' ? value : '';
          };

          mutation.mutate({ username: text('username'), password: text('password') });
        }}
      >
        <CardHeader className="gap-1.5 px-10">
          {/* Real heading: CardTitle renders a <div>, which screen readers skip. */}
          <CardTitle className="text-4xl font-semibold tracking-[-0.015em]">
            <h2>Iniciar sesión</h2>
          </CardTitle>
          <CardDescription>
            Para visualizar este tipo de contenido necesita una cuenta de acceso.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 px-10">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${fieldId}-username`}>Usuario</Label>
            <Input
              id={`${fieldId}-username`}
              name="username"
              type="text"
              required
              autoComplete="username"
              placeholder="usuario"
              className="h-10"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${fieldId}-password`}>Contraseña</Label>
            <Input
              id={`${fieldId}-password`}
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="********"
              className="h-10"
            />
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-6 px-10">
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="h-11 w-full rounded-2xl font-normal"
          >
            {mutation.isPending ? 'Accediendo…' : 'Acceder'}
          </Button>

          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {mutation.error instanceof LoginError && mutation.error.reason === 'credentials'
                ? 'No se pudo iniciar sesión. Revisa el usuario y la contraseña.'
                : 'No se pudo conectar con el servidor. Inténtalo de nuevo en unos minutos.'}
            </p>
          )}

          <p className="text-sm text-muted-foreground">
            El acceso identificado sirve únicamente para mostrar los indicadores privados, no crea
            un historial. Ni las geometrías subidas ni los resultados del análisis se guardan en el
            sistema. Recargar la página, abrir una pestaña nueva o cerrar sesión obliga a repetir el
            análisis.
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
