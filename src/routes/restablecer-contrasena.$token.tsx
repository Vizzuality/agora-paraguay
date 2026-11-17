import { useQuery } from '@tanstack/react-query';
import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import {
  AUTH_PAGE_CARD_CLASS,
  AuthCardPending,
  AuthPageFrame,
} from '@/components/auth/auth-page-frame';
import { NewPasswordCard } from '@/components/auth/new-password-card';
import { ResetOutcomeCard } from '@/components/auth/reset-outcome-card';
import { authQueries } from '@/lib/api/auth/queries';
import { resetTokenSchema } from '@/lib/api/auth/schemas';

/**
 * Where a password reset link lands: `/restablecer-contrasena/{token}`, the link the
 * backend composes and an administrator hands the user. The token is checked first, so a
 * spent link never shows a form it cannot submit.
 */
export const Route = createFileRoute('/restablecer-contrasena/$token')({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useParams();

  return (
    <AuthPageFrame title="Restablecer contraseña">
      <ClientOnly fallback={<AuthCardPending />}>
        <ResetPasswordFlow token={token} />
      </ClientOnly>
    </AuthPageFrame>
  );
}

function ResetPasswordFlow({ token }: Readonly<{ token: string }>) {
  const [updated, setUpdated] = useState(false);
  // A token that is not even a UUID cannot be a link the backend issued: no round trip.
  const wellFormed = resetTokenSchema.safeParse(token).success;
  const check = useQuery({ ...authQueries.resetToken(token), enabled: wellFormed });

  if (updated) return <ResetOutcomeCard outcome="updated" className={AUTH_PAGE_CARD_CLASS} />;

  if (!wellFormed || check.data === false || check.isError) {
    return <ResetOutcomeCard outcome="invalid-link" className={AUTH_PAGE_CARD_CLASS} />;
  }

  if (check.data !== true) return <AuthCardPending />;

  return (
    <NewPasswordCard
      token={token}
      onUpdated={() => setUpdated(true)}
      className={AUTH_PAGE_CARD_CLASS}
    />
  );
}
