import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { AddUserButton, CreateUserDialog } from '@/components/admin/create-user-dialog';
import { UserActionsMenu } from '@/components/admin/user-actions-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { authQueries } from '@/lib/api/auth/queries';
import { ApiError, errorReason } from '@/lib/api/http';

/** Rows the skeleton stands in for while the list loads. */
const SKELETON_ROWS = 5;

/**
 * The administration page's body: Añadir usuario above and below the
 * account list, one dialog behind both buttons. Renders inside the staff gate.
 */
export function UsersPanel() {
  const [creating, setCreating] = useState(false);
  const addButton = (
    <div className="flex justify-end">
      <AddUserButton onClick={() => setCreating(true)} />
    </div>
  );

  return (
    <div className="flex flex-col gap-14">
      {addButton}
      <UsersTable />
      {addButton}
      <CreateUserDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}

/**
 * Every account: its email and the row's actions menu in a card, one row per user in
 * the order the API answers (by email). A 403 behind the staff gate means the
 * session ended, not a wrong door.
 */
function UsersTable() {
  const users = useQuery(authQueries.users());

  if (users.isError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {users.error instanceof ApiError && users.error.status === 403
          ? 'La sesión ya no tiene permisos de administración. Vuelva a iniciar sesión.'
          : `No se pudo cargar la lista de usuarios: ${errorReason(users.error)}`}
      </p>
    );
  }

  return (
    <div className="rounded-3xl bg-accent px-6 py-4">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-12 text-base font-normal text-foreground uppercase">
              Email
            </TableHead>
            <TableHead className="h-12 w-0">
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody aria-busy={users.isPending || undefined}>
          {users.isPending &&
            Array.from({ length: SKELETON_ROWS }, (_, index) => (
              <TableRow key={index} className="hover:bg-transparent">
                <TableCell className="h-14">
                  <Skeleton className="h-4 w-56" />
                </TableCell>
                <TableCell className="h-14 w-0 py-3">
                  <Skeleton className="size-8 rounded-2xl" />
                </TableCell>
              </TableRow>
            ))}
          {users.data?.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={2} className="h-14 text-muted-foreground">
                No hay usuarios.
              </TableCell>
            </TableRow>
          )}
          {users.data?.map((user) => (
            <TableRow key={user.id} className="hover:bg-transparent">
              <TableCell className="h-14 font-semibold">{user.email}</TableCell>
              <TableCell className="h-14 w-0 py-3 text-right">
                <UserActionsMenu user={user} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
