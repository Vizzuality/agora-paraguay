import { useId, useState } from 'react';

import { AuthCard, AuthLinkButton } from '@/components/auth/auth-card';
import { RequestSentCard } from '@/components/auth/request-sent-card';
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
import { env } from '@/env';
import { resetRequestMailto } from '@/lib/auth/reset-request';

/**
 * The reset-password card: an email and a Solicitar button, on its own page
 * (`/restablecer-contrasena`), reached from the login modal.
 *
 * There is no request-reset endpoint and no mail server, so Solicitar opens the user's
 * mail client addressed to the admins (`VITE_ADMIN_EMAILS`) and the card turns into the
 * confirmation (`RequestSentCard`). Without admins configured, Solicitar is disabled.
 */
export function ResetPasswordCard({
  className,
  onBackToLogin,
}: Readonly<{ className?: string; onBackToLogin: () => void }>) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const fieldId = useId();
  const admins = env.VITE_ADMIN_EMAILS;

  if (sentTo !== null) {
    return (
      <RequestSentCard
        className={className}
        email={sentTo}
        onLogin={onBackToLogin}
        onRetry={() => setSentTo(null)}
      />
    );
  }

  return (
    <AuthCard className={className}>
      <form
        className="flex flex-col gap-6 py-10"
        onSubmit={(event) => {
          event.preventDefault();

          const email = new FormData(event.currentTarget).get('email');

          if (typeof email !== 'string' || !admins) return;

          // `assign`, not `open`: a mailto never replaces the page, it hands off to the
          // mail client and leaves the tab where it is.
          window.location.assign(resetRequestMailto(email, admins));
          setSentTo(email);
        }}
      >
        <CardHeader className="gap-1.5 px-10">
          <CardTitle className="text-4xl leading-[normal] font-light tracking-[-0.015em] text-foreground">
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
              placeholder="Email"
              className={FLOATING_FIELD_CLASS}
            />
            <FloatingLabel htmlFor={`${fieldId}-email`}>Email</FloatingLabel>
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-6 px-10">
          <Button type="submit" disabled={!admins} className="h-11 w-full rounded-2xl font-normal">
            Solicitar
          </Button>

          {!admins && (
            <p className="w-full text-sm text-muted-foreground">
              Solicitud no disponible: contacte con el administrador.
            </p>
          )}

          <p className="w-full text-sm text-muted-foreground">
            <AuthLinkButton onClick={onBackToLogin}>Iniciar sesión</AuthLinkButton> con sus
            credenciales
          </p>
        </CardFooter>
      </form>
    </AuthCard>
  );
}
