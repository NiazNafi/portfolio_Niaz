import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { defineConfig } from "vite";

const here = fileURLToPath(new URL(".", import.meta.url));

/**
 * Makes `npm run preview` behave like a real static host.
 *
 * Vite's preview server assumes a single-page app: it answers /ambigrams with
 * index.html rather than with the prerendered ambigrams/index.html. Netlify,
 * Vercel, GitHub Pages and S3 all resolve the directory index instead, so
 * without this the one command meant to rehearse production is the only place
 * that does not behave like it — and the difference is invisible, because the
 * client recovers from the mismatch and renders the right page anyway.
 *
 * Resolving the directory index here, ahead of the fallback, means what you
 * check locally is what visitors get.
 */
function staticHostPreview() {
  const dist = path.join(here, "dist");

  return {
    name: "static-host-preview",
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const [pathname] = (req.url ?? "/").split("?");
        if (path.extname(pathname)) return next();

        const candidate = path.join(dist, pathname, "index.html");
        if (candidate.startsWith(dist) && existsSync(candidate) && statSync(candidate).isFile()) {
          req.url = path.posix.join(pathname, "index.html");
        }
        return next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwind(), staticHostPreview()],
  // One .env at the workspace root rather than one per package: the client and
  // the optional API are configured together, and a split would make it possible
  // to point the browser at one Supabase project and the server at another.
  envDir: fileURLToPath(new URL("..", import.meta.url)),
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    // §8 budget is < 250KB JS gzipped on the initial route. Warn well before it.
    chunkSizeWarningLimit: 200,
    assetsInlineLimit: 2048,
    rollupOptions: {
      output: {
        // React and the router change on their own schedule; the site's own
        // code changes whenever a line of the CV does. Splitting them means a
        // content edit does not invalidate the framework chunk in anyone's cache.
        manualChunks(id) {
          if (id.includes("node_modules/react-router") || id.includes("node_modules/react")) {
            return "vendor";
          }
        },
      },
    },
  },
});
