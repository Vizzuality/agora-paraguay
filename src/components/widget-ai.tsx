import { type MutationStatus, useMutation } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { ListPlus, Loader, RefreshCw } from 'lucide-react';
import { lazy, Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SkeletonParagraph } from '@/components/ui/skeleton-paragraph';
import { isSameSummaryRequests, toSummaryRequests } from '@/lib/analysis/request';
import { useHeroFilters } from '@/lib/analysis/use-hero-filters';
import { analysisMutations } from '@/lib/api/analysis/queries';
import { errorReason } from '@/lib/api/http';
import { cn } from '@/lib/utils';
import { activeParcelIdAtom } from '@/store/analysis';

// Loaded with the first summary, not with the page: most visits never ask for one.
const Markdown = lazy(() => import('react-markdown'));

type WidgetAIProps = Readonly<{
  parcels: string[];
  className?: string;
}>;

/** What sits under the title: placeholder while generating, the summary once it lands. */
function SummaryBody({ status, text }: Readonly<{ status: MutationStatus; text?: string }>) {
  if (status === 'pending') return <SkeletonParagraph lines={6} />;

  if (status === 'success') {
    return (
      <div className="flex flex-col gap-2 text-sm text-muted-foreground [&_:is(h1,h2,h3,h4)]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_strong]:font-semibold [&_ul]:list-disc">
        <Suspense fallback={<p>{text}</p>}>
          <Markdown>{text}</Markdown>
        </Suspense>
      </div>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      Puede añadir al informe un resumen generado con inteligencia artificial.
    </p>
  );
}

/**
 * Productivo's AI summary for the hero's crop (Todos: soy and rice, one section each): of the
 * open tab's parcel, or under Todas of every analysed one. Reads atoms, so render inside
 * `<ClientOnly>`.
 */
export function WidgetAI({ parcels, className }: Readonly<WidgetAIProps>) {
  const mutation = useMutation(analysisMutations.summary());
  const activeId = useAtomValue(activeParcelIdAtom);
  const { resolvedFilters } = useHeroFilters('productivo');
  const requests = toSummaryRequests(parcels, activeId, resolvedFilters);
  const generate = () => requests && mutation.mutate(requests);
  // A summary (or its error) asked for another crop, year or parcel set no longer applies:
  // the card starts over rather than show, or print, it under the new filters.
  const stale =
    !mutation.isPending &&
    mutation.variables !== undefined &&
    !isSameSummaryRequests(mutation.variables, requests);
  const status = stale ? 'idle' : mutation.status;

  return (
    <Card
      className={cn(
        'min-w-50 flex-col gap-6 rounded-3xl border-0 bg-card p-6 text-card-foreground shadow-none backdrop-blur-xs',
        // Printed, no fill and no frame: the summary reads as text; no summary, no card.
        'print:bg-transparent',
        status !== 'success' && 'print:hidden',
        className,
      )}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        {/* Three quarters leave the button its column; printed, the button is gone. */}
        <div className="flex flex-col gap-2 sm:w-3/4 print:w-full" aria-busy={mutation.isPending}>
          <h3 className="text-[16px] leading-[20.3px] tracking-[0.28px]">Resumen del análisis</h3>

          {/* Mounted before the summary: a live region announces only what lands in it later. */}
          <div aria-live="polite">
            <SummaryBody status={status} text={mutation.data} />
          </div>

          {status === 'error' && (
            <p role="alert" className="text-sm text-destructive-text">
              No se pudo generar el resumen: {errorReason(mutation.error)}
            </p>
          )}
        </div>

        {status === 'success' ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 shrink-0 rounded-2xl px-8 font-normal print:hidden"
            disabled={requests === null}
            onClick={generate}
          >
            <RefreshCw aria-hidden />
            Reintentar
          </Button>
        ) : (
          <Button
            type="button"
            // Disabled against a double request but stays full-strength.
            className={cn(
              'h-11 shrink-0 rounded-2xl px-8 font-normal print:hidden',
              mutation.isPending && 'disabled:opacity-100',
            )}
            disabled={mutation.isPending || requests === null}
            onClick={generate}
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
