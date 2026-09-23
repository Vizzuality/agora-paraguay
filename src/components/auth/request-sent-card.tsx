import { AuthCard, AuthLinkButton } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Confirmation after Solicitar. Presentational: `ResetPasswordCard`
 * shows it once the mail client has been opened.
 */
export function RequestSentCard({
  className,
  email,
  onLogin,
  onRetry,
}: Readonly<{ className?: string; email: string; onLogin: () => void; onRetry: () => void }>) {
  return (
    <AuthCard className={className}>
      <div className="flex flex-col gap-6 py-10">
        <CardHeader className="gap-1.5 px-10">
          <CardTitle className="text-4xl font-semibold tracking-[-0.015em]">
            <h2>Solicitud enviada</h2>
          </CardTitle>
          <CardDescription className="flex flex-col gap-5">
            <span>
              Hemos recibido su solicitud. Si la dirección {email} está registrada, un administrador
              le enviará las instrucciones para restablecer su contraseña.
            </span>
            <span>
              Este proceso se gestiona manualmente y puede tardar varios días laborables. Revise
              también su carpeta de correo no deseado.
            </span>
          </CardDescription>
        </CardHeader>

        <CardFooter className="flex-col gap-6 px-10">
          <Button type="button" onClick={onLogin} className="h-11 w-full rounded-2xl font-normal">
            Iniciar sesión
          </Button>

          <p className="w-full text-sm text-muted-foreground">
            ¿No ha recibido nada?{' '}
            <AuthLinkButton onClick={onRetry}>Enviar otra solicitud</AuthLinkButton>
          </p>
        </CardFooter>
      </div>
    </AuthCard>
  );
}
