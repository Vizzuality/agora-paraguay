import { Link } from '@tanstack/react-router';

import { LoginPopover, UserButton } from '@/components/auth/login-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Session } from '@/lib/api/auth/schemas';
import { sessionDisplayName } from '@/lib/auth/display-name';
import { useLogout, useSession } from '@/lib/auth/use-session';

/**
 * The top bar's account button: the login popover while anonymous; signed in, a menu
 * naming the user, with Administrar usuarios for staff and Cerrar sesión. Reads the
 * session, so render it inside `<ClientOnly>` with `<UserButton />` as the fallback.
 */
export function AccountMenu() {
  const session = useSession();

  return session ? <SignedInMenu session={session} /> : <LoginPopover />;
}

function SignedInMenu({ session }: Readonly<{ session: Session }>) {
  const logout = useLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <UserButton aria-label="Cuenta" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={20} className="w-56">
        <DropdownMenuLabel className="truncate">{sessionDisplayName(session)}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {session.isStaff && (
          <DropdownMenuItem asChild>
            <Link to="/usuarios">Administrar usuarios</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem disabled={logout.isPending} onSelect={() => logout.mutate()}>
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
