# Production-optimized Dockerfile for Railway deployment
# Features: Multi-stage build, layer caching, security hardening, performance optimization

# ====================================================================
# Stage 1: Base dependencies layer (cached across builds)
# ====================================================================
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable pnpm && corepack prepare pnpm@8.15.0 --activate

# ====================================================================
# Stage 2: Dependencies installation (heavily cached)
# ====================================================================
FROM base AS deps

# Copy only package files for optimal layer caching
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prefer-offline --production=false

# ====================================================================
# Stage 3: Builder with build cache
# ====================================================================
FROM base AS builder

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set build arguments for runtime configuration
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_DOMAIN

# Build-time optimizations
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    SKIP_ENV_VALIDATION=1 \
    # Enable SWC minification
    NEXT_MINIFY_JS=true \
    # Optimize for production
    NODE_OPTIONS="--max-old-space-size=4096"

# Build with caching for Next.js
RUN pnpm run build

# Remove development dependencies after build
RUN pnpm prune --production

# ====================================================================
# Stage 4: Production runner (minimal size)
# ====================================================================
FROM node:20-alpine AS runner
WORKDIR /app

# Install only runtime essentials
RUN apk add --no-cache libc6-compat curl tini && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/.next/cache && \
    chown -R nextjs:nodejs /app

# Copy standalone build (minimal footprint)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Supabase migrations for production checks
COPY --from=builder --chown=nextjs:nodejs /app/supabase ./supabase

# Runtime environment defaults (overridden by Railway)
# IMPORTANT: Do NOT set PORT here - Railway provides it automatically
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME="0.0.0.0" \
    # Enable Node.js cluster mode for better performance
    NODE_CLUSTER_WORKERS=2 \
    # Memory optimization
    NODE_OPTIONS="--max-old-space-size=512"

# Security: Run as non-root user
USER nextjs

# IMPORTANT: Do not expose a specific port - Railway handles this
# Railway automatically assigns and exposes the correct port
# EXPOSE statement removed to prevent port conflicts

# Health check using dynamic PORT from environment
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/api/health || exit 1

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start with Node.js directly (no npm/pnpm overhead)
CMD ["node", "server.js"]