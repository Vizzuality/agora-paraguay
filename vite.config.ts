import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import { nitroV2Plugin } from '@tanstack/nitro-v2-vite-plugin';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  /**
   * Where the dev server forwards `/api`. The Django backend sets a session cookie, and
   * a cookie from another origin over plain http never sticks in a browser — so in dev
   * the app talks to itself and Vite relays. Defaults to a local Django; set
   * `API_PROXY_TARGET` (shell or `.env`) to reach a shared backend.
   */
  const API_PROXY_TARGET =
    loadEnv(mode, process.cwd(), '').API_PROXY_TARGET ?? 'http://localhost:8000';

  return {
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: API_PROXY_TARGET,
          changeOrigin: true,
          // Django's CSRF check compares Origin/Referer against the host it serves; make
          // the relayed request look like it came from there.
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('origin', API_PROXY_TARGET);
              proxyReq.setHeader('referer', `${API_PROXY_TARGET}/`);
            });
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
      },
    },
    plugins: [
      tailwindcss(),
      tanstackStart(),
      nitroV2Plugin({
        compatibilityDate: '2026-08-11',
        // Unset locally and in Docker -> Nitro's default `node-server`, which emits
        // .output/server/index.mjs (the container entrypoint). Vercel sets
        // NITRO_PRESET=vercel so the target is chosen explicitly rather than sniffed.
        preset: process.env.NITRO_PRESET,
      }),
      // react's vite plugin must come after start's vite plugin
      viteReact(),
    ],
  };
});
