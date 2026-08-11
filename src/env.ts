import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Environment variables, validated at module load.
 *
 * `VITE_USE_MOCK_API` exists so the mock and real data paths can coexist while the
 * external API is being built. See `src/lib/api/client.ts`.
 */
export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_USE_MOCK_API: z
      .enum(["true", "false"])
      .default("true")
      .transform((value) => value === "true"),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
});
