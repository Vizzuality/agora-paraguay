import type { Filters } from '@/lib/api/metadata/schemas';

/*
 * Some metadata descriptions depend on the hero filters and reference them as
 * `{'id': 'date'}` — a Python dict repr of the filter — e.g. "las últimas 72 horas
 * previas a {'id': 'date'}". Users read the filter's current value there instead:
 * the picked option's label for a category, dd/mm/yyyy for a date. A filter the hero does
 * not have, or one without a value yet, reads as the filter's name, else its id.
 */

const FILTER_REF = /\{\s*['"]id['"]\s*:\s*['"]([^'"]+)['"]\s*\}/g;

export function describeWithFilters(
  description: string,
  filters: Filters,
  resolved: Record<string, string>,
): string {
  return description.replace(FILTER_REF, (_match, id: string) => {
    const filter = filters.find((entry) => entry.id === id);
    const value = resolved[id];

    if (!filter) return id;
    if (value === undefined || value === '') return filter.name;

    switch (filter.field_type.type) {
      case 'category':
        return filter.field_type.options.find((option) => option.value === value)?.label ?? value;
      case 'date':
        return formatIsoDate(value);
    }
  });
}

/** `YYYY-MM-DD` as the platform prints dates, `dd/mm/yyyy`; anything else is left as is. */
function formatIsoDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}
