import { atom } from 'jotai';

import type { Session } from '@/lib/api/schemas';

/**
 * The identified session. `null` means anonymous: `/analisis` shows the login gate
 * instead of the private indicators, and Analizar lands on the gate rather than a
 * risk tab.
 *
 * Deliberately not persisted (the login-card copy promises exactly that): the session
 * lives on Jotai's default module store, so a hard reload, a new tab, or closing the
 * browser logs the user out. Consumers must render inside `<ClientOnly>` — the SSR
 * caveats on `draw-core.ts` apply here too.
 */
export const sessionAtom = atom<Session | null>(null);
