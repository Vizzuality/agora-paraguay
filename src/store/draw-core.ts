import { atom } from "jotai";
import { atomWithReducer } from "jotai/utils";
import type { TerraDraw } from "terra-draw";

import { drawReducer, INITIAL_DRAW_STATE } from "@/lib/map/draw-state";

/**
 * The shared core of the draw store. **Store-internal**: imported only by the feature
 * files in `src/store` (`draw.ts`, `analysis.ts`, `upload.ts`). Components never touch
 * these — they consume the derived and command atoms the feature files export, which is
 * what keeps the reducer's action vocabulary and the Terra Draw instance encapsulated.
 *
 * These live on Jotai's default store, which is shared per module rather than per render
 * tree — on the server that would mean one store across every request. Nothing reads or
 * writes them during SSR: both the map and the controls render inside `<ClientOnly>`,
 * and the state is seeded by `bindDrawAtom` from an effect on the client. Keep it that
 * way, or scope the store with Jotai's `Provider` before rendering atoms on the server.
 */
export const drawStateAtom = atomWithReducer(INITIAL_DRAW_STATE, drawReducer);

/** The Terra Draw instance itself. Written by `bindDrawAtom`, read by command atoms. */
export const drawInstanceAtom = atom<TerraDraw | null>(null);
