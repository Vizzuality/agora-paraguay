import { createFileRoute } from '@tanstack/react-router';
import {
  ChevronDown,
  CircleAlert,
  Info,
  Layers,
  MapPin,
  Pencil,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { StatCard } from '@/components/stat-card';
import { ThemeToggle } from '@/components/theme-toggle';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Meter } from '@/components/ui/meter';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const Route = createFileRoute('/ui')({ component: UiKitPage });

const DEMO_DATES = ['01/01/2015', '01/01/2020', '01/07/2026'];

function Section({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

function UiKitPage() {
  return (
    <TooltipProvider>
      <main className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
            <h1 className="text-xl font-bold">Kit de interfaz</h1>
            <ThemeToggle />
          </div>
        </header>

        <div className="mx-auto flex max-w-4xl flex-col gap-12 px-6 py-10">
          <Section title="Botones">
            <Row>
              <Button>Primario</Button>
              <Button variant="secondary">Secundario</Button>
              <Button variant="outline">Contorno</Button>
              <Button variant="ghost">Fantasma</Button>
              <Button variant="link">Enlace</Button>
              <Button variant="destructive">Eliminar</Button>
              <Button disabled>Deshabilitado</Button>
            </Row>
            <Row>
              <Button size="xs">Extra pequeño</Button>
              <Button size="sm">Pequeño</Button>
              <Button size="default">Mediano</Button>
              <Button size="lg">Grande</Button>
              <Button size="icon-xs" variant="outline" aria-label="Añadir">
                <Plus />
              </Button>
              <Button size="icon-sm" variant="outline" aria-label="Añadir">
                <Plus />
              </Button>
              <Button size="icon" variant="outline" aria-label="Añadir">
                <Plus />
              </Button>
              <Button size="icon-lg" variant="outline" aria-label="Añadir">
                <Plus />
              </Button>
            </Row>
          </Section>

          <Section title="Insignias">
            <Row>
              <Badge>Predeterminada</Badge>
              <Badge variant="secondary">Secundaria</Badge>
              <Badge variant="outline">Contorno</Badge>
              <Badge variant="destructive">Destructiva</Badge>
              <Badge variant="ghost">Fantasma</Badge>
              <Badge variant="link">Enlace</Badge>
              <Badge variant="secondary">
                <MapPin /> Con icono
              </Badge>
            </Row>
          </Section>

          <Section title="Alternador y menú desplegable">
            <Row>
              <Toggle aria-label="Marcar como favorito">
                <Star /> Favorito
              </Toggle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Capas <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <Pencil /> Editar
                    <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive">
                    <Trash2 /> Eliminar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem checked>Mostrar etiquetas</DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value="satelite">
                    <DropdownMenuRadioItem value="mapa">Mapa</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="satelite">Satélite</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Exportar</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem>GeoJSON</DropdownMenuItem>
                      <DropdownMenuItem>Shapefile</DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </Row>
          </Section>

          <Section title="Formularios">
            <div className="grid max-w-md gap-6">
              <div className="grid gap-2">
                <Label htmlFor="demo-name">Nombre del área</Label>
                <Input id="demo-name" placeholder="Reserva San Rafael" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="demo-notes">Notas</Label>
                <Textarea id="demo-notes" placeholder="Observaciones sobre el área…" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="demo-check" defaultChecked />
                <Label htmlFor="demo-check">Incluir en el análisis</Label>
              </div>
              <RadioGroup defaultValue="poligono" className="gap-2">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="poligono" id="demo-r1" />
                  <Label htmlFor="demo-r1">Polígono dibujado</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="archivo" id="demo-r2" />
                  <Label htmlFor="demo-r2">Archivo subido</Label>
                </div>
              </RadioGroup>
              <div className="grid gap-2">
                <Label>Departamento</Label>
                <Select defaultValue="itapua">
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Seleccionar departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Región Oriental</SelectLabel>
                      <SelectItem value="itapua">Itapúa</SelectItem>
                      <SelectItem value="alto-parana">Alto Paraná</SelectItem>
                      <SelectItem value="central">Central</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Región Occidental</SelectLabel>
                      <SelectItem value="boqueron">Boquerón</SelectItem>
                      <SelectItem value="alto-paraguay">Alto Paraguay</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              {/* Private-hero field: uppercase caption plus the `underline` trigger. */}
              <div className="grid gap-1.5">
                <Label className="text-xs leading-3 font-normal text-muted-foreground uppercase">
                  Fecha de inicio
                </Label>
                <Select defaultValue={DEMO_DATES[0]}>
                  <SelectTrigger variant="underline" className="w-64">
                    <SelectValue placeholder="Seleccionar fecha" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEMO_DATES.map((date) => (
                      <SelectItem key={date} value={date}>
                        {date}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="demo-switch" defaultChecked />
                <Label htmlFor="demo-switch">Capa visible</Label>
              </div>
            </div>
          </Section>

          <Section title="Superposiciones">
            <Row>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Abrir diálogo</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Renombrar área</DialogTitle>
                    <DialogDescription>
                      El nuevo nombre se mostrará en la lista de polígonos.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-2">
                    <Label htmlFor="demo-dialog-name">Nombre</Label>
                    <Input id="demo-dialog-name" defaultValue="Área 1" />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button>Guardar</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Eliminar área</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogMedia>
                      <Trash2 />
                    </AlertDialogMedia>
                    <AlertDialogTitle>¿Eliminar esta área?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. El polígono se eliminará del mapa.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction variant="destructive">Eliminar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Layers /> Detalles de capa
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <PopoverHeader>
                    <PopoverTitle>Cobertura forestal</PopoverTitle>
                    <PopoverDescription>
                      Datos de ejemplo del servicio de análisis simulado.
                    </PopoverDescription>
                  </PopoverHeader>
                </PopoverContent>
              </Popover>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Más información">
                    <Info />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Información sobre la capa</TooltipContent>
              </Tooltip>
            </Row>
          </Section>

          <Section title="Alertas">
            <Alert>
              <Info />
              <AlertTitle>Análisis en curso</AlertTitle>
              <AlertDescription>
                Los resultados aparecerán en el panel lateral al finalizar.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <CircleAlert />
              <AlertTitle>No se pudo procesar el archivo</AlertTitle>
              <AlertDescription>
                El archivo KMZ contiene geometrías no compatibles. Los polígonos con huecos se
                omiten.
              </AlertDescription>
            </Alert>
          </Section>

          <Section title="Tarjetas y medidores">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Área analizada</CardTitle>
                  <CardDescription>Resumen del último análisis</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Tres polígonos enviados al servicio de análisis el 21 de agosto.
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="outline">
                    Ver detalle
                  </Button>
                </CardFooter>
              </Card>
              <StatCard
                label="Cobertura forestal"
                value="48 %"
                caption="Dentro del área dibujada"
                action={<Switch defaultChecked aria-label="Mostrar capa" />}
              />
            </div>
            <div className="grid max-w-md gap-3">
              <Meter value={25} />
              <Meter value={60} color="var(--chart-2)" />
              <Meter value={90} color="var(--chart-4)" />
            </div>
          </Section>

          <Section title="Pestañas">
            <Tabs defaultValue="resumen" className="max-w-md">
              <TabsList>
                <TabsTrigger value="resumen">Resumen</TabsTrigger>
                <TabsTrigger value="capas">Capas</TabsTrigger>
                <TabsTrigger value="historial">Historial</TabsTrigger>
              </TabsList>
              <TabsContent value="resumen" className="text-sm text-muted-foreground">
                Contenido del resumen.
              </TabsContent>
              <TabsContent value="capas" className="text-sm text-muted-foreground">
                Contenido de capas.
              </TabsContent>
              <TabsContent value="historial" className="text-sm text-muted-foreground">
                Contenido del historial.
              </TabsContent>
            </Tabs>
            <Tabs defaultValue="resumen" className="max-w-md">
              <TabsList variant="line">
                <TabsTrigger value="resumen">Resumen</TabsTrigger>
                <TabsTrigger value="capas">Capas</TabsTrigger>
              </TabsList>
              <TabsContent value="resumen" className="text-sm text-muted-foreground">
                Variante de línea.
              </TabsContent>
              <TabsContent value="capas" className="text-sm text-muted-foreground">
                Contenido de capas.
              </TabsContent>
            </Tabs>
          </Section>

          <Section title="Tabla">
            <Table>
              <TableCaption>Capas de ejemplo del análisis simulado.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Capa</TableHead>
                  <TableHead>Cobertura</TableHead>
                  <TableHead className="text-right">Superficie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Bosque nativo</TableCell>
                  <TableCell>48 %</TableCell>
                  <TableCell className="text-right">1 240 ha</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Cuerpos de agua</TableCell>
                  <TableCell>7 %</TableCell>
                  <TableCell className="text-right">180 ha</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Uso agrícola</TableCell>
                  <TableCell>45 %</TableCell>
                  <TableCell className="text-right">1 160 ha</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Section>

          <Section title="Separador y esqueletos">
            <div className="flex max-w-md items-center gap-3 text-sm">
              <span>Dibujo</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Subida</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Análisis</span>
            </div>
            <Separator className="max-w-md" />
            <div className="flex max-w-md flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          </Section>
        </div>
      </main>
    </TooltipProvider>
  );
}
