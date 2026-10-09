import { type MutationStatus, useMutation } from '@tanstack/react-query';
import { ListPlus, Loader, RefreshCw } from 'lucide-react';
import Markdown from 'react-markdown';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SkeletonParagraph } from '@/components/ui/skeleton-paragraph';
import { analysisMutations } from '@/lib/api/analysis/queries';
import { errorReason } from '@/lib/api/http';
import { cn } from '@/lib/utils';

type WidgetAIProps = Readonly<{
  parcels: string[];
  className?: string;
}>;

/** What sits under the title: placeholder while generating, the summary once it lands. */
function SummaryBody({ status, text }: Readonly<{ status: MutationStatus; text?: string }>) {
  if (status === 'pending') return <SkeletonParagraph lines={6} />;

  if (status === 'success') {
    return (
      <div
        aria-live="polite"
        className="flex flex-col gap-2 text-sm text-muted-foreground [&_:is(h1,h2,h3,h4)]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_strong]:font-semibold [&_ul]:list-disc"
      >
        <Markdown>{text}</Markdown>
      </div>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      Puede añadir al informe un resumen generado con inteligencia artificial.
    </p>
  );
}

export function WidgetAI({ parcels, className }: Readonly<WidgetAIProps>) {
  const mutation = useMutation(analysisMutations.summary());

  return (
    <Card
      className={cn(
        'min-w-50 flex-col gap-6 rounded-3xl border-0 bg-card p-6 text-card-foreground shadow-none backdrop-blur-xs',
        // Printed, the summary is body text of the report, not a card.
        'print:bg-transparent print:p-0',
        className,
      )}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        {/* Three quarters leave the button its column; printed, the button is gone. */}
        <div className="flex flex-col gap-2 sm:w-3/4 print:w-full" aria-busy={mutation.isPending}>
          <h3 className="text-[16px] leading-[20.3px] tracking-[0.28px]">Resumen del análisis</h3>

          <SummaryBody status={mutation.status} text={mutation.data} />

          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              No se pudo generar el resumen: {errorReason(mutation.error)}
            </p>
          )}
        </div>

        {mutation.isSuccess ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 shrink-0 rounded-2xl px-8 font-normal print:hidden"
            onClick={() => mutation.mutate({ parcels })}
          >
            <RefreshCw aria-hidden />
            Reintentar
          </Button>
        ) : (
          <Button
            type="button"
            // Generando is disabled against a double request but stays full-strength.
            className={cn(
              'h-11 shrink-0 rounded-2xl px-8 font-normal print:hidden',
              mutation.isPending && 'disabled:opacity-100',
            )}
            disabled={mutation.isPending || parcels.length === 0}
            onClick={() => mutation.mutate({ parcels })}
          >
            {mutation.isPending ? (
              <Loader aria-hidden className="size-6 animate-spin" />
            ) : (
              <ListPlus aria-hidden />
            )}
            {mutation.isPending ? 'Generando' : 'Generar resumen'}
          </Button>
        )}
      </div>
    </Card>
  );
}
