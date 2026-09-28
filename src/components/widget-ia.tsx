import { useMutation } from '@tanstack/react-query';
import { ListPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { analysisMutations } from '@/lib/api/analysis/queries';
import { errorReason } from '@/lib/api/http';
import { cn } from '@/lib/utils';

type WidgetIaProps = {
  parcels: string[];
  className?: string;
};

export function WidgetIa({ parcels, className }: WidgetIaProps) {
  const mutation = useMutation(analysisMutations.summary());

  return (
    <Card
      className={cn(
        'min-w-50 flex-col gap-6 rounded-3xl border-0 bg-card p-6 text-card-foreground shadow-none backdrop-blur-xs',
        className,
      )}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex max-w-150 flex-col gap-2">
          <h3 className="text-[16px] leading-[20.3px] tracking-[0.28px]">Resumen del análisis</h3>
          <p className="text-sm text-muted-foreground">
            Puede añadir al informe un resumen generado con inteligencia artificial.
          </p>
        </div>

        <Button
          type="button"
          className="h-11 shrink-0 rounded-2xl px-8 font-normal"
          disabled={mutation.isPending || parcels.length === 0}
          onClick={() => mutation.mutate({ parcels })}
        >
          <ListPlus aria-hidden />
          {mutation.isPending
            ? 'Generando resumen…'
            : mutation.isSuccess
              ? 'Generar de nuevo'
              : 'Generar resumen'}
        </Button>
      </div>

      {mutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          No se pudo generar el resumen: {errorReason(mutation.error)}
        </p>
      )}

      {mutation.isSuccess && (
        <p aria-live="polite" className="text-sm whitespace-pre-line">
          {mutation.data.summary}
        </p>
      )}
    </Card>
  );
}
