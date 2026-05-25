FROM node:22-alpine AS builder

RUN corepack enable \
 && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build && pnpm exec nest build card-processor

# --- production dependencies only ---
FROM node:22-alpine AS deps

RUN corepack enable \
 && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# --- card-issuer ---
FROM node:22-alpine AS card-issuer

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

CMD ["node", "dist/apps/card-issuer/infrastructure/nestjs/main.js"]

# --- card-processor ---
FROM node:22-alpine AS card-processor

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

CMD ["node", "dist/apps/card-processor/infrastructure/nestjs/main.js"]
