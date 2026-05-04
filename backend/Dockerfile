# ─── Stage 1: Build admin-ui ───
FROM node:22-alpine AS admin-builder
WORKDIR /app
ARG VITE_BASE_PATH=/admin/
ARG VITE_ROUTER_BASE=/admin
ARG VITE_API_BASE=
COPY shared ./shared
COPY admin-ui/package.json admin-ui/package-lock.json* ./admin-ui/
RUN cd admin-ui && npm ci
COPY admin-ui ./admin-ui
ENV VITE_BASE_PATH=$VITE_BASE_PATH
ENV VITE_ROUTER_BASE=$VITE_ROUTER_BASE
ENV VITE_API_BASE=$VITE_API_BASE
RUN cd admin-ui && npm run build

# ─── Stage 2: Build client-ui UMD widget ───
FROM node:22-alpine AS client-builder
WORKDIR /app
COPY shared ./shared
COPY client-ui/package.json client-ui/package-lock.json* ./client-ui/
RUN cd client-ui && npm ci
COPY client-ui ./client-ui
RUN cd client-ui && npm run build:umd

# ─── Stage 3: Build SDK ───
FROM node:22-alpine AS sdk-builder
WORKDIR /app
COPY sdk/package.json sdk/package-lock.json* ./sdk/
RUN cd sdk && npm ci
COPY sdk ./sdk
RUN cd sdk && npm run build

# ─── Stage 4: Build docs-ui ───
FROM node:22-alpine AS docs-builder
WORKDIR /app
COPY docs-ui/package.json docs-ui/package-lock.json* ./docs-ui/
RUN cd docs-ui && npm ci
COPY docs-ui ./docs-ui
RUN cd docs-ui && npm run build

# ─── Stage 5: Build backend ───
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci
COPY backend/prisma ./prisma
RUN npx prisma generate
COPY backend/tsconfig.json backend/tsconfig.build.json backend/nest-cli.json ./
COPY backend/src ./src
RUN npm run build

# ─── Stage 5: Production ───
FROM node:22-alpine
WORKDIR /app

# Backend production dependencies
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm ci --omit=dev

# Prisma client + compiled backend
COPY --from=backend-builder /app/backend/node_modules/.prisma ./backend/node_modules/.prisma
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY backend/prisma ./backend/prisma
COPY backend/public ./backend/public

# Admin UI (full dist — assets + index.html for SPA fallback)
COPY --from=admin-builder /app/admin-ui/dist ./admin-ui/dist

# Client UI widget (floating ChatBubble — UMD bundle)
COPY --from=client-builder /app/client-ui/dist-umd ./client-ui/dist-umd

# SDK loader
COPY --from=sdk-builder /app/sdk/dist ./sdk/dist

# Docs UI
COPY --from=docs-builder /app/docs-ui/dist ./docs-ui/dist

EXPOSE 3000

CMD ["sh", "-c", "cd /app/backend && npx prisma migrate deploy && node dist/src/main.js"]
