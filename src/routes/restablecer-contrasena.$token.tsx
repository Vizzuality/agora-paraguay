import { useQuery } from '@tanstack/react-query';
import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { NewPasswordCard } from '@/components/auth/new-password-card';
import { ResetOutcomeCard } from '@/components/auth/reset-outcome-card';
import { PageFrame } from '@/components/frame/page-frame';
import { Spinner } from '@/components/ui/spinner';
import { authQueries } from '@/lib/api/auth/queries';
import { resetTokenSchema } from '@/lib/api/auth/schemas';
import { cn } from '@/lib/utils';

/** The auth card filling the settings column's width. */
const CARD_CLASS = 'md:w-full md:shrink';

/**
 * Where a password reset link lands: `/restablecer-contrasena/{token}`, the link the
 * backend composes and an administrator hands the user. The analysis pages' frame, the
 * card in the settings column over an empty frame, the content column one empty frame.
 * The token is checked first, so a spent link never shows a form it cannot submit.
 */
export const Route = createFileRoute('/restablecer-contrasena/$token')({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useParams();

  return (
    <PageFrame
      settings={
        <>
          <ClientOnly fallback={<Pending />}>
            <ResetPasswordFlow token={token} />
          </ClientOnly>
          <EmptyFrame className="min-h-44" />
        </>
      }
    >
      <h1 className="sr-only">Restablecer contraseña</h1>
      <EmptyFrame className="min-h-108" />
    </PageFrame>
  );
}

function ResetPasswordFlow({ token }: Readonly<{ token: string }>) {
  const [updated, setUpdated] = useState(false);
  // A token that is not even a UUID cannot be a link the backend issued: no round trip.
  const wellFormed = resetTokenSchema.safeParse(token).success;
  const check = useQuery({ ...authQueries.resetToken(token), enabled: wellFormed });

  if (updated) return <ResetOutcomeCard outcome="updated" className={CARD_CLASS} />;

  if (!wellFormed || check.data === false || check.isError) {
    return <ResetOutcomeCard outcome="invalid-link" className={CARD_CLASS} />;
  }

  if (check.data !== true) return <Pending />;

  return (
    <NewPasswordCard token={token} onUpdated={() => setUpdated(true)} className={CARD_CLASS} />
  );
}

/** A spinner in the card's place while the link is being checked. */
function Pending() {
  return (
    <div className="flex min-h-72 items-center justify-center rounded-3xl bg-card" aria-busy>
      <Spinner />
    </div>
  );
}

/** An empty widget frame, as the design leaves the page around the card. */
function EmptyFrame({ className }: Readonly<{ className?: string }>) {
  return (
    <div
      aria-hidden
      className={cn('flex-1 rounded-3xl border-3 border-border backdrop-blur-xs', className)}
    />
  );
}
