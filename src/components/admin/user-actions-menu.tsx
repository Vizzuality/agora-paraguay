import { Ellipsis } from 'lucide-react';
import { useState } from 'react';

import { DeleteUserDialog } from '@/components/admin/delete-user-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AdminUser } from '@/lib/api/auth/schemas';

export function UserActionsMenu({ user }: Readonly<{ user: AdminUser }>) {
  const [deleting, setDeleting] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            aria-label={`Acciones de ${user.username}`}
            className="h-8 w-8 shrink-0 rounded-full shadow-none data-[state=open]:bg-accent"
          >
            <Ellipsis aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={true}
            onSelect={() => {
              // TODO(backoffice-api): call the admin password-reset endpoint once it exists.
              console.info(`password reset requested for ${user.username} — TODO: connect to API`);
            }}
          >
            Restablecer contraseña
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDeleting(true)}>Borrar cuenta</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteUserDialog user={user} open={deleting} onOpenChange={setDeleting} />
    </>
  );
}
