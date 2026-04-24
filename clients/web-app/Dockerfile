# =============================================================================
# Dockerfile — Web App (React + Vite)
# Multi-stage: Node 20 build → nginx:alpine serve
# =============================================================================

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Build-time API URLs (baked into the JS bundle by Vite)
ARG VITE_IDENTITY_API_URL
ARG VITE_SEARCH_API_URL
ARG VITE_BOOKING_API_URL
ARG VITE_ACCOMMODATION_API_URL
ENV VITE_IDENTITY_API_URL=$VITE_IDENTITY_API_URL
ENV VITE_SEARCH_API_URL=$VITE_SEARCH_API_URL
ENV VITE_BOOKING_API_URL=$VITE_BOOKING_API_URL
ENV VITE_ACCOMMODATION_API_URL=$VITE_ACCOMMODATION_API_URL

# Copy dependency files first for layer caching
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Build args for Vite env vars
ARG VITE_IDENTITY_API_URL=http://localhost:8001/api/v1
ARG VITE_ACCOMMODATION_API_URL=http://localhost:8003/api/v1
ARG VITE_SEARCH_API_URL=http://localhost:8002/api/v1
ARG VITE_BOOKING_API_URL=http://localhost:8004/api/v1
ARG VITE_PAYMENT_API_URL=http://localhost:8005/api/v1
ARG VITE_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder

# Set as environment variables for Vite build
ENV VITE_IDENTITY_API_URL=$VITE_IDENTITY_API_URL
ENV VITE_ACCOMMODATION_API_URL=$VITE_ACCOMMODATION_API_URL
ENV VITE_SEARCH_API_URL=$VITE_SEARCH_API_URL
ENV VITE_BOOKING_API_URL=$VITE_BOOKING_API_URL
ENV VITE_PAYMENT_API_URL=$VITE_PAYMENT_API_URL
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:alpine AS production

# Custom nginx config (SPA routing + health endpoint)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]

