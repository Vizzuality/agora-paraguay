import { X } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Destructive toast (Figma node 5166:5055): a "Ha habido un error." headline over the
 * body, dismissable from the corner. `label` names the landmark for screen readers and
 * the e2e locators.
 */
export function ErrorToast({
  label,
  dismissLabel,
  onDismiss,
  children,
}: {
  label: string;
  dismissLabel: string;
  onDismiss: () => void;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={label}
      className="relative flex flex-col gap-2 rounded-md bg-destructive py-6 pr-8 pl-6 text-sm text-destructive-foreground shadow-lg"
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label={dismissLabel}
        className="absolute top-2 right-2 opacity-90 hover:opacity-100"
      >
        <X aria-hidden className="size-4" />
      </button>

      <p className="font-semibold">Ha habido un error.</p>
      <div className="flex flex-col gap-2 opacity-90">{children}</div>
    </section>
  );
}

/** Figma node 5229:13620. Doubles as the out-of-Paraguay body until that is redefined. */
export const NO_PARCEL_INTERSECTION_MESSAGE =
  'El polígono que ha dibujado no toca el área de ninguna parcela.';

/**
 * TODO: mount this once the parcels API can test intersection — a drawn polygon that
 * touches no cadastral parcel should surface this toast (Figma node 5229:13620).
 * Currently unreferenced on purpose: the mock data has no intersection answer.
 */
export function NoParcelIntersectionToast({ onDismiss }: { onDismiss: () => void }) {
  return (
    <ErrorToast
      label="Aviso de dibujo"
      dismissLabel="Descartar el aviso de dibujo"
      onDismiss={onDismiss}
    >
      <p>{NO_PARCEL_INTERSECTION_MESSAGE}</p>
    </ErrorToast>
  );
}
