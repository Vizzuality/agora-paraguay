import type * as React from 'react';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Custom, not stock shadcn (like `meter.tsx`). A label that rests inside its field while
 * the field is empty and floats onto the top border once it has a value, is open or is
 * focused — the WS Form "inside label" behaviour, styled per the Figma hero fields.
 *
 * Pure CSS, driven by the sibling: render the trigger/input first with the `peer` class
 * and this label right after it inside a `relative` wrapper. The `field-empty` variant
 * (`globals.css`) reads Radix Select's `data-placeholder` or a native input's
 * `:placeholder-shown` — give inputs `placeholder=" "` so the label is the placeholder.
 * `bg-card` masks the border it sits on — pass `bg-background` when the field is not
 * inside a card.
 */
export const FLOATING_FIELD_CLASS =
  'peer h-12 w-full rounded-2xl border-muted-foreground bg-transparent px-4 py-3 text-base shadow-none focus-visible:border-primary md:text-base';

/** The floated chip on its own, for captions over non-form boxes (the parcel tabs). */
export const FLOATING_CHIP_CLASS =
  'pointer-events-none absolute top-0 left-3 -translate-y-1/2 bg-card px-1 py-0.5 text-xs leading-3 font-normal text-muted-foreground uppercase';

export function FloatingLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="floating-label"
      className={cn(
        FLOATING_CHIP_CLASS,
        'transition-all duration-150 motion-reduce:transition-none',
        // Resting: empty, closed and unfocused → sits in the field like a placeholder.
        'field-empty:top-1/2 field-empty:left-4 field-empty:bg-transparent field-empty:px-0 field-empty:text-base field-empty:leading-6 field-empty:normal-case',
        className,
      )}
      {...props}
    />
  );
}
