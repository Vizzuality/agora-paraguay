import { useQuery } from '@tanstack/react-query';
import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { GateFrame } from '@/components/auth/login-gate';
import { NewPasswordCard } from '@/components/auth/new-password-card';
import { ResetOutcomeCard } from '@/components/auth/reset-outcome-card';
import { Footer } from '@/components/footer';
import { HeaderNav } from '@/components/sidebar/header-nav';
import { NavBar } from '@/components/sidebar/nav-bar';
import { Spinner } from '@/components/ui/spinner';
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
    <div className="flex min-h-screen w-full flex-col">
      <NavBar>
        <HeaderNav />
      </NavBar>

      <main className="flex flex-1 flex-col gap-6 px-2 pt-6 pb-10 md:px-10 md:pt-10 md:pb-12">
        <ClientOnly fallback={<Pending />}>
          <ResetPasswordFlow token={token} />
        </ClientOnly>
      </main>

      <Footer />
    </div>
  );
}

function ResetPasswordFlow({ token }: Readonly<{ token: string }>) {
  const [updated, setUpdated] = useState(false);
  // A token that is not even a UUID cannot be a link the backend issued: no round trip.
  const wellFormed = resetTokenSchema.safeParse(token).success;
  const check = useQuery({ ...authQueries.resetToken(token), enabled: wellFormed });

  if (updated) {
    return (
      <GateFrame>
        <ResetOutcomeCard outcome="updated" />
      </GateFrame>
    );
  }

  if (!wellFormed || check.data === false || check.isError) {
    return (
      <GateFrame>
        <ResetOutcomeCard outcome="invalid-link" />
      </GateFrame>
    );
  }

  if (check.data !== true) return <Pending />;

  return (
    <GateFrame>
      <NewPasswordCard token={token} onUpdated={() => setUpdated(true)} />
    </GateFrame>
  );
}

/** The frame with a spinner where the card goes, while the link is being checked. */
function Pending() {
  return (
    <GateFrame>
      <div className="flex min-w-96 flex-1 items-center justify-center" aria-busy>
        <Spinner />
      </div>
    </GateFrame>
  );
}
