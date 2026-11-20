/**
 * What closed Tipo de análisis shows beside its name: the user's identifier, once given,
 * before the type.
 */
export function analysisTypeSummary(identifier: string, type: string | undefined) {
  const id = identifier.trim();
  if (!type) return id || undefined;
  return id ? `${id} - ${type}` : type;
}
