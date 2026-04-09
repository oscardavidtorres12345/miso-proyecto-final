# =============================================================================
# Dockerfile — Web App (React + Vite)
# Multi-stage: Node 20 build → nginx:alpine serve
# =============================================================================

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files first for layer caching
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:alpine AS production

RUN apk add --no-cache curl

# Custom nginx config (SPA routing + health endpoint)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -fs http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]

