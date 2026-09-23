import { ListPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type WidgetIaProps = {
  className?: string;
};

export function WidgetIa({ className }: WidgetIaProps) {
  return (
    <Card
      className={cn(
        'min-w-50 flex-col gap-6 rounded-3xl border-0 bg-card p-6 text-card-foreground shadow-none backdrop-blur-xs sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="flex max-w-150 flex-col gap-2">
        <h3 className="text-[16px] leading-[20.3px] tracking-[0.28px]">Resumen del análisis</h3>
        <p className="text-sm text-muted-foreground">
          Puede añadir al informe un resumen generado con inteligencia artificial.
        </p>
      </div>

      <Button type="button" className="h-11 shrink-0 rounded-2xl px-8 font-normal">
        <ListPlus aria-hidden />
        Generar resumen
      </Button>
    </Card>
  );
}
