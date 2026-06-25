# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────
# ssamAI Web — Next.js standalone production image
# Phase 2: npm 기반 (pnpm store 정체 회피)
# Build context: 루트 (docker-compose.yml에서 context: . 설정)
# ─────────────────────────────────────────────────────────────

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ── deps ─────────────────────────────────────────────────────
FROM base AS deps
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci --prefer-offline --no-audit --no-fund

# ── builder ──────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app/apps/web
COPY --from=deps /app/node_modules /app/node_modules
COPY apps/web/ ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx next build

# ── runner ───────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./apps/web/
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/package.json ./apps/web/package.json

USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]