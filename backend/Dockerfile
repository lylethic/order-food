# ============================================================
# Stage 1 — deps: install ALL dependencies (dev + prod)
# ============================================================
FROM node:22-alpine AS deps

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ============================================================
# Stage 2 — builder: generate Prisma client + compile TypeScript
# ============================================================
FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
COPY --from=deps /app/node_modules ./node_modules

COPY tsconfig.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client BEFORE tsc so @prisma/client types exist
RUN pnpm db:generate

# Compile TypeScript → dist/
RUN pnpm build

# ============================================================
# Stage 3 — runner: lean production image
# ============================================================
FROM node:22-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

# Install production-only dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy Prisma schema, migrations, and config (needed for migrate deploy + generate)
COPY prisma.config.ts ./
COPY prisma ./prisma

# Generate Prisma client against the production node_modules
RUN pnpm db:generate

# Copy compiled TypeScript output
COPY --from=builder /app/dist ./dist

# Create uploads directory for serving static files
RUN mkdir -p uploads

EXPOSE 3001

# prisma db push syncs schema.prisma directly to DB (no migration gap)
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/server.js"]
