# Stage 1: Build
FROM node:20-slim AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm

COPY packages/core/package.json packages/core/
RUN pnpm install --frozen-lockfile

COPY packages/core/tsconfig.json packages/core/
COPY packages/core/src/ packages/core/src/
RUN pnpm --filter @secuclaw/core run build

# Stage 2: Production
FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y dumb-init && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/packages/core/dist ./dist
COPY --from=builder /app/packages/core/package.json .
COPY --from=builder /app/node_modules ./node_modules

RUN mkdir -p /data

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0
ENV DATA_PATH=/data

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
