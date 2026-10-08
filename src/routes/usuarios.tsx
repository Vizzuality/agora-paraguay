import { ClientOnly, createFileRoute, Navigate } from '@tanstack/react-router';

import { UsersPanel } from '@/components/admin/users-table';
import { LoginGate } from '@/components/auth/login-gate';
import { Footer } from '@/components/footer';
import { HeaderNav } from '@/components/sidebar/header-nav';
import { NavBar } from '@/components/sidebar/nav-bar';
import { useSession } from '@/lib/auth/use-session';

/** Administrar usuarios, staff only: the account list between header and footer. */
export const Route = createFileRoute('/usuarios')({
  component: UsersPage,
});

function UsersPage() {
  return (
    // Nav and footer outside <main>, like `/analisis`: that is what gives them their
    // banner/contentinfo landmark roles.
    <div className="flex min-h-screen w-full flex-col">
      <NavBar>
        <HeaderNav />
      </NavBar>

      <main className="flex flex-1 flex-col gap-6 px-10 pt-10 pb-12">
        <ClientOnly fallback={<LoginGate hydrating />}>
          <StaffGate />
        </ClientOnly>
      </main>

      <Footer />
    </div>
  );
}

/** Anonymous: the login gate. Signed in without staff rights: nothing to see, back to the map. */
function StaffGate() {
  const session = useSession();

  if (!session) return <LoginGate />;
  if (!session.isStaff) return <Navigate to="/" replace />;

  return (
    <>
      {/* The design has no visible title; the heading names the page for screen readers. */}
      <h1 className="sr-only">Administrar usuarios</h1>
      <UsersPanel />
    </>
  );
}
