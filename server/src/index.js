/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ DORMANT. The site does not use this.                                    │
 * │                                                                         │
 * │ The portfolio is a static build. Content comes from content/source.mjs,  │
 * │ every asset is committed to this repository, and `npm run build`         │
 * │ produces a dist/ folder that deploys to any static host — which is what  │
 * │ requirements §8 asks for.                                               │
 * │                                                                         │
 * │ This server exists as an optional extra: it reads the same content from  │
 * │ Postgres so the CV can be edited without a redeploy. Nothing points at   │
 * │ it. VITE_API_URL is blank, so the client never calls it, and if it did,  │
 * │ the page would already have rendered from the bundle before the request  │
 * │ went out.                                                               │
 * │                                                                         │
 * │ It is kept working rather than deleted so the option stays open. To turn │
 * │ it on, see "The dormant backend" in README.md.                          │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

import { createHash } from "node:crypto";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { getContent } from "./content.js";
import { isConfigured } from "./supabase.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(here, "../../client/dist");

const app = express();
const PORT = Number(process.env.PORT ?? 8787);

app.disable("x-powered-by");
app.set("etag", false); // set explicitly below, from the payload itself

/**
 * The site loads no third-party anything: fonts, images and scripts are all
 * same-origin (requirements §8). So the CSP can be genuinely restrictive
 * rather than the usual pile of exceptions.
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"], // Vite inlines critical CSS
        "img-src": ["'self'", "data:"],
        "font-src": ["'self'"],
        "connect-src": ["'self'"],
        "frame-ancestors": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
        "object-src": ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);

app.use(compression());

/**
 * In production the client is served from the same origin and needs no CORS at
 * all. ALLOWED_ORIGINS exists for the split-deploy case (client on Netlify,
 * API on Railway) and for `vite dev` on :5173.
 */
const allowed = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  "/api",
  cors({
    origin: allowed.length ? allowed : false,
    methods: ["GET"],
    maxAge: 86400,
  }),
);

// ── routes ─────────────────────────────────────────────────────────────────

app.get("/api/health", async (_req, res) => {
  const { source, error } = await getContent();
  res.json({
    ok: true,
    // `degraded` is the one worth alerting on: Supabase is configured but the
    // read failed, so somebody has rotated a key or paused the project.
    degraded: isConfigured && source !== "supabase",
    supabase: isConfigured ? "configured" : "not configured",
    source,
    ...(error ? { error } : {}),
  });
});

app.get("/api/content", async (req, res) => {
  const { payload, source } = await getContent({ force: req.query.fresh === "1" });
  const body = JSON.stringify(payload);
  const etag = `W/"${createHash("sha1").update(body).digest("base64url")}"`;

  res.set("ETag", etag);
  // The content is a CV. A five-minute browser cache with a day of
  // stale-while-revalidate means a visitor never waits on this request, and an
  // edit is live everywhere within the hour.
  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=86400");
  res.set("X-Content-Source", source);

  if (req.headers["if-none-match"] === etag) return res.status(304).end();

  res.type("application/json").send(body);
});

// A single ambigram's data, for anything that wants one piece.
app.get("/api/ambigrams/:id", async (req, res) => {
  const { payload } = await getContent();
  const piece = payload.ambigrams.find((a) => a.id === req.params.id);
  if (!piece) return res.status(404).json({ error: "no such ambigram" });
  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=86400");
  res.json(piece);
});

app.use("/api", (_req, res) => res.status(404).json({ error: "no such endpoint" }));

// ── static client (single-origin deploy) ───────────────────────────────────

if (existsSync(clientDist)) {
  const setHeaders = (res, filePath) => {
    // Hashed asset filenames are safe to cache for a year; HTML never is.
    if (/\.(?:js|css|woff2|webp|png|svg)$/.test(filePath) && /-[A-Za-z0-9_]{8,}\./.test(filePath)) {
      res.set("Cache-Control", "public, max-age=31536000, immutable");
    } else if (/\.html$/.test(filePath)) {
      res.set("Cache-Control", "public, max-age=0, must-revalidate");
    }
  };

  app.use(express.static(clientDist, { index: "index.html", redirect: false, setHeaders }));

  /**
   * Every route is a real prerendered file, at <route>/index.html. Serving
   * those directly — rather than redirecting /ambigrams to /ambigrams/ and
   * letting the static handler find it — keeps the URLs in the address bar
   * identical to the canonical ones in the sitemap.
   *
   * The order matters: a wrong answer here is not a missing page but a
   * hydration mismatch, because the browser would parse one route's HTML and
   * then hydrate the router's idea of a different route on top of it.
   */
  app.get(/.*/, (req, res) => {
    const candidate = path.join(clientDist, req.path, "index.html");
    if (candidate.startsWith(clientDist) && existsSync(candidate)) {
      setHeaders(res, candidate);
      return res.sendFile(candidate);
    }
    return res.status(404).sendFile(path.join(clientDist, "404.html"), (err) => {
      if (err) res.status(404).type("text/plain").send("Not found");
    });
  });
} else {
  app.get("/", (_req, res) =>
    res
      .type("text/plain")
      .send("Content API is up. Build the client (`npm run build`) to serve the site from here."),
  );
}

app.use((err, _req, res, _next) => {
  console.error("[error]", err);
  res.status(500).json({ error: "internal error" });
});

const server = app.listen(PORT, () => {
  console.log(`content API listening on http://localhost:${PORT}`);
  console.log(`  supabase: ${isConfigured ? "configured" : "not configured (snapshot mode)"}`);
  console.log(`  client:   ${existsSync(clientDist) ? clientDist : "not built"}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}

export default app;
