import { useId } from 'react';

import { AuthCard, AuthLinkButton } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FLOATING_FIELD_CLASS, FloatingLabel } from '@/components/ui/floating-label';
import { Input } from '@/components/ui/input';

/**
 * The reset-password card (Figma 5596:1619): an email and a Solicitar button. Shown in
 * place of `LoginCard` by whoever hosts it (`LoginGate`, `LoginDialog`).
 *
 * TODO(auth-reset-request): Solicitar posts nothing yet. The API has no request-reset
 * endpoint — `POST /api/auth/password/reset/` sets a password from a one-time link
 * (`setPassword`), and there is no mail. Wire the call in `auth/client.ts` once it exists.
 */
export function ResetPasswordCard({
  className,
  onBackToLogin,
}: Readonly<{ className?: string; onBackToLogin: () => void }>) {
  const fieldId = useId();

  return (
    <AuthCard className={className}>
      <form className="flex flex-col gap-6 py-10" onSubmit={(event) => event.preventDefault()}>
        <CardHeader className="gap-1.5 px-10">
          <CardTitle className="text-4xl font-semibold tracking-[-0.015em]">
            <h2>Restablecer contraseña</h2>
          </CardTitle>
          <CardDescription>
            Introduzca su dirección de email y le enviaremos instrucciones para restablecer la
            contraseña.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-10">
          <div className="relative">
            <Input
              id={`${fieldId}-email`}
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder=" "
              className={FLOATING_FIELD_CLASS}
            />
            <FloatingLabel htmlFor={`${fieldId}-email`}>Email</FloatingLabel>
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-6 px-10">
          <Button type="submit" className="h-11 w-full rounded-2xl font-normal">
            Solicitar
          </Button>

          <p className="w-full text-sm text-muted-foreground">
            <AuthLinkButton onClick={onBackToLogin}>Iniciar sesión</AuthLinkButton> con sus
            credenciales
          </p>
        </CardFooter>
      </form>
    </AuthCard>
  );
}
