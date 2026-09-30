import { useQuery } from '@tanstack/react-query';

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
 * Every account, as the administration page shows them (Figma 5565:988): username and
 * email in a card, one row per user in the order the API answers (by username). The row
 * actions and Añadir usuario from the design come with their own endpoints and tickets.
 * Renders inside the staff gate, so a 403 here means the session ended, not a wrong door.
 */
export function UsersTable() {
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
              Nombre de usuario
            </TableHead>
            <TableHead className="h-12 text-base font-normal text-foreground uppercase">
              Email
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody aria-busy={users.isPending || undefined}>
          {users.isPending &&
            Array.from({ length: SKELETON_ROWS }, (_, index) => (
              <TableRow key={index} className="hover:bg-transparent">
                <TableCell className="h-14">
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell className="h-14">
                  <Skeleton className="h-4 w-56" />
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
              <TableCell className="h-14 font-semibold">{user.username}</TableCell>
              <TableCell className="h-14">{user.email}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
