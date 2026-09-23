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
import { resetRequestMailto } from '@/lib/auth/reset-request';

/**
 * The reset-password card (Figma 5596:1619): an email and a Solicitar button. Shown in
 * place of `LoginCard` by whoever hosts it (`LoginGate`, `LoginDialog`).
 *
 * There is no request-reset endpoint and no mail server, so Solicitar opens the user's
 * mail client addressed to the admin (`resetRequestMailto`) and the card turns into the
 * confirmation (`RequestSentCard`).
 */
export function ResetPasswordCard({
  className,
  onBackToLogin,
}: Readonly<{ className?: string; onBackToLogin: () => void }>) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const fieldId = useId();

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

          if (typeof email !== 'string') return;

          // `assign`, not `open`: a mailto never replaces the page, it hands off to the
          // mail client and leaves the tab where it is.
          window.location.assign(resetRequestMailto(email));
          setSentTo(email);
        }}
      >
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
