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

/** The date as the attribution writes it, in Spanish: `19 de noviembre de 2026`. */
export function reportLongDate(date: Date): string {
  return new Intl.DateTimeFormat('es-PY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * The line closing the report: the platform, the analysis's identifier
 * (Identificador de análisis) and the day it was generated. Without an identifier the
 * clause naming it is left out rather than printed empty.
 */
export function reportAttribution(identifier: string, date: Date): string {
  const code = identifier.trim();
  const analysis = code ? `para el análisis con identificación ${code}` : 'para este análisis';

  return `Estos resultados se han generado mediante la plataforma AGORA ${analysis}, el ${reportLongDate(date)}.`;
}
