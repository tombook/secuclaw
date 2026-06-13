FROM oven/bun:1.1.38-alpine AS builder

WORKDIR /app

COPY package.json bun.lock ./
COPY packages/core/package.json ./packages/core/
COPY packages/ui/package.json ./packages/ui/

RUN bun install --frozen-lockfile --production=false

COPY packages/core ./packages/core
COPY packages/ui ./packages/ui

RUN cd packages/core && bun build src/main.ts --outdir dist --target bun --minify

FROM oven/bun:1.1.38-alpine AS runtime

WORKDIR /app

RUN apk add --no-cache tini curl dumb-init

RUN addgroup -S secuclaw && adduser -S secuclaw -G secuclaw

COPY --from=builder /app/packages/core/dist ./dist
COPY --from=builder /app/packages/core/data ./data
COPY --from=builder /app/packages/core/node_modules ./node_modules

RUN chown -R secuclaw:secuclaw /app

USER secuclaw

ENV NODE_ENV=production
ENV PORT=21981
ENV STORAGE_PATH=/app/data/storage
ENV LOG_LEVEL=info

EXPOSE 21981

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:21981/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["bun", "run", "dist/main.js"]
