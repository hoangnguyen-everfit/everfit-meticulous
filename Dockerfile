# ---- Stage 1: build ----
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies with pnpm via corepack
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# Build. METICULOUS_BUILD=true lets the app know this is a build used for testing
# (gate any heavy retrying data-fetch if present).
COPY . .
ENV METICULOUS_BUILD=true
RUN pnpm build

# ---- Stage 2: runtime ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# The Next standalone server reads these two; HOSTNAME=0.0.0.0 to bind inside the container.
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Copy the standalone output (server + minimal deps)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
