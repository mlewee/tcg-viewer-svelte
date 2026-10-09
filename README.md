# Trading Card Catalog Viewer (Svelte Version)

SvelteKit viewer for the TCG card catalog and price tracking API.
Replaces the React `tcg-viewer` SPA (kept unchanged in its own repository).

This project is a test for using svelte instead of react/vue like my past projects

- SvelteKit + Svelte 5 runes + TypeScript + plain CSS, no CSS framework
- `@sveltejs/adapter-static` output in `build/` (Cloudflare Pages compatible)
- Dependency-free SVG price chart, no chart library, no state library
- Real routes: `/`, `/releases`, `/updates`, `/about`
  (old `#catalog` / `#releases` / `#updates` / `#about` hashes redirect)

## Local development

```sh
cp .env.example .env
npm install
npm run dev          # http://localhost:5173
```

The dev server talks to the Go API via relative `/api/...` requests when
`PUBLIC_API_BASE` is empty. Point it at a local backend with a vite proxy
or run behind the Traefik stack (see Docker below).

## Production build (static / Cloudflare Pages)

```sh
npm run check        # svelte-check
npm run build        # -> build/
```

- Same-origin deployment (Traefik/Docker): build with `PUBLIC_API_BASE` empty.
- Cloudflare Pages (cross-origin): build with the public API origin, e.g.
  `PUBLIC_API_BASE=https://tcg.example.com npm run build`, then publish `build/`.
- The Go backend's `CORS_ALLOWED_ORIGINS` must include the Pages origin.

## Docker (VPS / server-stack)

to run on the same reverse proxy and database stack as my other projects

```sh
# Same-origin API via Traefik (default):
docker build -t tcg-frontend:latest .
# Cross-origin API baked in at build time:
docker build --build-arg PUBLIC_API_BASE=https://tcg.example.com -t tcg-frontend:latest .

# Run with the existing stack (requires infra + tcg backend on app-network):
DOMAIN=example.com docker compose up -d --build
# Local preview without Traefik:
docker compose -f compose.yml -f compose.dev.yml up --build  # http://127.0.0.1:8081
```

Traefik routes `tcg-frontend.${DOMAIN}` to this container and forwards
`/api/*` on the same host to the Go API service (`tcg-go@docker`).

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `PUBLIC_API_BASE` | No (default empty) | Build-time API base. Empty = relative `/api/...` (same-origin). Set to the Go API origin for Cloudflare Pages. |
| `DOMAIN` | Yes for compose | Base domain for Traefik Host rules (same convention as `server-stack/tcg`). |

Go backend note: add the frontend origin to `CORS_ALLOWED_ORIGINS` in
`server-stack/tcg/.env` when serving cross-origin.
