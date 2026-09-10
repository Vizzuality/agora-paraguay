import { SELECTION_STEPS, type SelectionStep } from '@/lib/selection-steps';
import { cn } from '@/lib/utils';

/** The three-step progress bar over the selection panel (Figma 7172:1773). */
export function SelectionSteps({ current }: Readonly<{ current: SelectionStep }>) {
  return (
    <ol aria-label="Pasos de la selección" className="flex w-full gap-0.5">
      {SELECTION_STEPS.map(({ number, label }) => {
        const state = number < current ? 'done' : number === current ? 'current' : 'pending';

        return (
          <li
            key={number}
            aria-current={state === 'current' ? 'step' : undefined}
            className="flex flex-1 flex-col gap-2"
          >
            <div aria-hidden className="flex h-6 items-center gap-0.5">
              {state === 'pending' ? <Track tone="pending" /> : <Track tone="done" />}
              {state === 'current' && (
                <>
                  <span className="h-6 w-1 shrink-0 rounded-sm bg-highlight" />
                  <Track tone="pending" />
                </>
              )}
            </div>

            <p className="flex flex-col items-center gap-1 text-center">
              <span className="text-xs text-muted-foreground">Paso {number}</span>
              <span
                className={cn(
                  'text-base tracking-[0.28px] whitespace-pre-line',
                  state === 'current' ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function Track({ tone }: Readonly<{ tone: 'done' | 'pending' }>) {
  return (
    <span
      className={cn(
        'h-2 flex-1 rounded-sm',
        tone === 'done' ? 'bg-highlight/50' : 'bg-muted-foreground/25',
      )}
    />
  );
}
