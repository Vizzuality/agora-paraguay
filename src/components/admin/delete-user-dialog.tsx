import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { authMutations, authQueries } from '@/lib/api/auth/queries';
import type { AdminUser } from '@/lib/api/auth/schemas';
import { ApiError } from '@/lib/api/http';

function failureMessage(error: unknown): string {
  if (error instanceof ApiError && error.detail !== null) return error.detail;

  return 'No se pudo borrar la cuenta. Inténtelo de nuevo en unos minutos.';
}

/**
 * Confirms Borrar cuenta before the request goes out — the design has no step here, but
 * a delete cannot be undone. The API's refusals (the administrator's own account, an
 * account already gone) are quoted inside; deleting refreshes the list behind it.
 */
export function DeleteUserDialog({
  user,
  open,
  onOpenChange,
}: Readonly<{ user: AdminUser; open: boolean; onOpenChange: (open: boolean) => void }>) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    ...authMutations.deleteUser(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authQueries.users().queryKey });
      onOpenChange(false);
    },
  });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        // Reopening never starts on the last refusal.
        if (!next) mutation.reset();
      }}
    >
      <AlertDialogContent className="w-[411px] max-w-none gap-6 rounded-3xl border-0 bg-card p-10 text-card-foreground shadow-none">
        <div className="flex flex-col gap-1.5">
          <AlertDialogTitle className="text-4xl font-light tracking-[-0.015em]">
            ¿Borrar la cuenta de {user.email}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            El usuario perderá el acceso a la plataforma. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </div>

        <div className="flex flex-col gap-6">
          {/* Not `AlertDialogAction`: that closes on click, and a refusal must stay visible. */}
          <Button
            type="button"
            variant="destructive"
            disabled={mutation.isPending}
            className="h-11 w-full rounded-2xl font-normal"
            onClick={() => mutation.mutate(user.id)}
          >
            {mutation.isPending ? 'Borrando…' : 'Borrar'}
          </Button>
          <AlertDialogCancel variant="secondary" className="h-11 w-full rounded-2xl font-normal">
            Cancelar
          </AlertDialogCancel>

          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {failureMessage(mutation.error)}
            </p>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
