import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Login card (Figma node 5180:12026). Layout only for now: the GMV auth backend
 * does not exist yet (AGP-22), so submitting is a no-op until the API contract lands.
 */
export function LoginCard() {
  return (
    <Card className="w-[411px] shrink-0 gap-0 rounded-3xl border-0 py-0 shadow-none">
      <form className="flex flex-col gap-6 py-10" onSubmit={(event) => event.preventDefault()}>
        <CardHeader className="gap-1.5 px-10">
          {/* Real heading: CardTitle renders a <div>, which screen readers skip. */}
          <CardTitle className="text-4xl font-semibold tracking-[-0.015em]">
            <h2>Iniciar sesión</h2>
          </CardTitle>
          <CardDescription>
            Para visualizar este tipo de contenido necesita una cuenta de acceso.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 px-10">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="example@vizzuality.com"
              className="h-10"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="login-password">Contraseña</Label>
            <Input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="********"
              className="h-10"
            />
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-6 px-10">
          <Button type="submit" className="h-11 w-full rounded-2xl font-normal">
            Acceder
          </Button>
          <p className="text-sm text-muted-foreground">
            El acceso identificado sirve únicamente para mostrar los indicadores privados, no crea
            un historial. Ni las geometrías subidas ni los resultados del análisis se guardan en el
            sistema. Recargar la página, abrir una pestaña nueva o cerrar sesión obliga a repetir el
            análisis.
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
