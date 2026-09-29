import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type InfoTipProps = {
  /** The metadata's `description`; nothing renders without one. */
  description?: string | null;
  /** What the description is about — names the button ("Más información sobre …"). */
  subject: string;
  className?: string;
};

export function InfoTip({ description, subject, className }: InfoTipProps) {
  if (!description) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Más información sobre ${subject}`}
          className={cn(
            'pointer-events-auto inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
            className,
          )}
        >
          <InfoCircledIcon />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-64 text-sm leading-5">
        {description}
      </PopoverContent>
    </Popover>
  );
}

function InfoCircledIcon() {
  return (
    <svg
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 15 15"
      fill="none"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.06436 0C3.16282 0 0 3.16282 0 7.06435C0 10.9659 3.16282 14.1288 7.06436 14.1288C10.9659 14.1288 14.1287 10.9659 14.1287 7.06435C14.1287 3.16282 10.9659 0 7.06436 0ZM1.01333 7.06435C1.01333 3.72247 3.72247 1.01333 7.06436 1.01333C10.4062 1.01333 13.1153 3.72247 13.1153 7.06435C13.1153 10.4062 10.4062 13.1154 7.06436 13.1154C3.72247 13.1154 1.01333 10.4062 1.01333 7.06435ZM7.86437 3.86464C7.86437 4.30646 7.50619 4.66464 7.06437 4.66464C6.62254 4.66464 6.26437 4.30646 6.26437 3.86464C6.26437 3.4228 6.62254 3.06464 7.06437 3.06464C7.50619 3.06464 7.86437 3.4228 7.86437 3.86464ZM5.46448 5.46464H7.06448C7.35904 5.46464 7.59782 5.70341 7.59782 5.99797V9.73131H8.66448V10.798H5.46448V9.73131H6.53115V6.5313H5.46448V5.46464Z"
        fill="currentColor"
      />
    </svg>
  );
}
