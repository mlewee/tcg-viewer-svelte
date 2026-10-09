import { defineEnvVars } from '@sveltejs/kit/env';

// Build-time public API base for the static frontend.
// Empty (default) means same-origin /api/... requests, which the
// Traefik/Docker stack routes to the Go API. Set it at build time
// for Cloudflare Pages or any cross-origin deployment.
export const variables = defineEnvVars({
  PUBLIC_API_BASE: {
    public: true,
    static: true,
    description: 'Base URL of the tcg Go API. Empty means same-origin /api/... requests.',
    schema: (value) => (value ?? '').trim()
  }
});
