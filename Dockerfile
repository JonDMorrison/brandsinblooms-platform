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

# Install runtime essentials and Supabase CLI
RUN apk add --no-cache libc6-compat curl tini postgresql-client bash && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/.next/cache && \
    chown -R nextjs:nodejs /app

# Install Supabase CLI (latest stable version)
RUN curl -sSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | \
    tar -xz -C /tmp && \
    mv /tmp/supabase /usr/local/bin/supabase && \
    chmod +x /usr/local/bin/supabase && \
    rm -rf /tmp/* && \
    # Verify installation
    supabase --version

# Copy standalone build (minimal footprint)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Supabase migrations, config, templates, and seeds for production
COPY --from=builder --chown=nextjs:nodejs /app/supabase/migrations ./supabase/migrations
COPY --from=builder --chown=nextjs:nodejs /app/supabase/config.toml ./supabase/config.toml
COPY --from=builder --chown=nextjs:nodejs /app/supabase/templates ./supabase/templates
COPY --from=builder --chown=nextjs:nodejs /app/supabase/seeds ./supabase/seeds
COPY --chown=nextjs:nodejs scripts/run-migrations.sh scripts/docker-entrypoint.sh scripts/migration-monitor.sh scripts/migration-batch-processor.sh scripts/run-seeds.sh ./scripts/
RUN chmod +x ./scripts/*.sh

# Runtime environment defaults (overridden by Railway)
# IMPORTANT: Do NOT set PORT here - Railway provides it automatically
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME="0.0.0.0" \
    # Enable Node.js cluster mode for better performance
    NODE_CLUSTER_WORKERS=2 \
    # Memory optimization - reduced to allow headroom for migrations
    NODE_OPTIONS="--max-old-space-size=384"

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

# Start Next.js directly (migrations/seeds handled separately)
CMD ["node", "server.js"]