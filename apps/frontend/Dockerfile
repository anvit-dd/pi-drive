FROM oven/bun:latest AS base

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates openssl python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun ci --include=optional

FROM base AS builder

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN bunx --bun prisma generate && \
    bun run build

FROM base AS runner

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=deps /app/node_modules ./node_modules

RUN mkdir -p .next prisma && \
    chown -R nextjs:nodejs .next prisma node_modules && \
    chmod -R g+rwX prisma

USER nextjs

EXPOSE 3000