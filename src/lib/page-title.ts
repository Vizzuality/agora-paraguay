/** The tab title of the landing and of any page without its own. */
export const SITE_TITLE = 'AGORA';

/** A page's `head`: its name first, so tabs and history tell the pages apart. */
export function pageHead(name: string) {
  return { meta: [{ title: `${name} · ${SITE_TITLE}` }] };
}
