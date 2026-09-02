import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

/**
 * Environment variables, validated at module load.
 *
 * `VITE_USE_MOCK_API` exists so the mock and real data paths can coexist while the
 * external API is being built. See `src/lib/api/client.ts`.
 */
export const env = createEnv({
  clientPrefix: 'VITE_',
  client: {
    VITE_USE_MOCK_API: z
      .enum(['true', 'false'])
      .default('true')
      .transform((value) => value === 'true'),

    /**
     * Basemap style URL override. Unset, the app uses the built-in satellite style
     * (see `src/lib/map/basemap.ts`). Point this at the client's tile endpoint to
     * override.
     */
    VITE_BASEMAP_STYLE_URL: z.url().optional(),

    /**
     * Origin of the Django API for deployed builds, e.g. `https://api.example.com`.
     * Unset, auth calls go to the same origin under `/api`, which the Vite dev server
     * proxies to the backend (see `vite.config.ts`) so its session cookie stays
     * first-party.
     */
    VITE_API_URL: z.url().optional(),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
});
