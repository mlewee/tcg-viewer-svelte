# Multi-stage Dockerfile for the tcg-frontend SvelteKit static site.
#
# Stage 1: build the SvelteKit app into `build/` (adapter-static).
# Stage 2: serve `build/` from nginx with static fallbacks.
#
# PUBLIC_API_BASE is a build-time variable (baked into the static
# output). Empty (default) means same-origin /api/... requests,
# which Traefik routes to the Go API (see compose.yml). Set it at
# build time for Cloudflare Pages or any cross-origin deployment:
#   docker build --build-arg PUBLIC_API_BASE=https://tcg.example.com .

# ----- Build stage -----
FROM node:24-slim AS build

WORKDIR /app

ARG PUBLIC_API_BASE=""
ENV PUBLIC_API_BASE=${PUBLIC_API_BASE}

# Install deps first for Docker layer caching.
COPY package*.json ./
RUN npm ci

# Copy the rest of the source and build.
COPY vite.config.ts tsconfig.json ./
COPY src ./src
COPY static ./static
RUN npm run build

# ----- Serve stage -----
FROM nginx:alpine

# Static fallback config for prerendered SvelteKit routes.
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
