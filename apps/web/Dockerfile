# Production Next.js image (API + site). Build from the repository root:
#   docker compose build
#   docker build -f apps/web/Dockerfile .
#
# apps/web depends on the root package via "psp_course_work": "file:../..",
# so the build context is the monorepo root. Reusable later for PH-48.

FROM node:20-bookworm-slim AS deps

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /repo

COPY package.json ./
COPY apps/web/package.json apps/web/package-lock.json ./apps/web/
COPY apps/web/prisma ./apps/web/prisma

WORKDIR /repo/apps/web
RUN npm ci

FROM node:20-bookworm-slim AS builder

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /repo

COPY --from=deps /repo /repo
COPY apps/web ./apps/web

WORKDIR /repo/apps/web

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://prophover:prophover@postgres:5432/prophover
ENV AUTH_TOKEN_TTL_DAYS=14
ENV AUTH_REQUIRED=true

RUN npx prisma generate
RUN npm run build

FROM node:20-bookworm-slim AS runner

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

WORKDIR /repo

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=nextjs:nodejs /repo/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web /repo/apps/web
COPY --chmod=755 --chown=nextjs:nodejs apps/web/docker-entrypoint.sh /repo/apps/web/docker-entrypoint.sh

WORKDIR /repo/apps/web

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
