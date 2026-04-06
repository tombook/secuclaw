# Stage 1: Build dependencies
FROM node:20-slim AS deps
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml ./
COPY packages/core/package.json packages/core/
RUN pnpm install --frozen-lockfile --prod

# Stage 2: Build source code
FROM node:20-slim AS builder
WORKDIR /app
RUN corepack enable pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @secuclaw/core run build
RUN pnpm --filter @secuclaw/ui run build

# Stage 3: Production runtime
FROM node:20-slim
WORKDIR /app

# Install security updates and runtime dependencies
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends dumb-init tzdata ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    # Create non-root user for security
    groupadd -r secuclaw && useradd -r -g secuclaw secuclaw

# Copy build artifacts
COPY --from=builder /app/packages/core/dist ./dist
COPY --from=builder /app/packages/core/package.json .
COPY --from=builder /app/packages/ui/dist ./public
COPY --from=deps /app/node_modules ./node_modules

# Create data directory and set permissions
RUN mkdir -p /data && chown -R secuclaw:secuclaw /data
VOLUME /data

# Environment configuration
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0
ENV DATA_PATH=/data
ENV STATIC_PATH=/app/public

# Security: Run as non-root user
USER secuclaw

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
