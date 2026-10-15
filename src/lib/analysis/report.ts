import type { Riesgo } from '@/lib/api/metadata/schemas';

/*
 * The report is the analysis page printed: a print stylesheet hides the chrome and the
 * browser's own "save as PDF" makes the file. Pure helpers here; the trigger that touches
 * the document is `print-report.ts`.
 */

/** `YYYY-MM-DD` in the user's local time, the date the report says it was generated. */
export function reportDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}

/** What the browser proposes as the file name: `agora-productivo-2026-10-09`. */
export function reportFileName(riesgo: Riesgo, date: Date): string {
  return `agora-${riesgo}-${reportDate(date)}`;
}

/** The line the report carries instead of the buttons: when it was generated. */
export function reportCaption(date: Date): string {
  const formatted = new Intl.DateTimeFormat('es-PY', { dateStyle: 'long' }).format(date);

  return `Informe generado el ${formatted}`;
}
