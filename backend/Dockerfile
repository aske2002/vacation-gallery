# Stage 1 — Build frontend
FROM node:20 AS frontend-builder
WORKDIR /app/frontend

# Keep monorepo structure so relative imports match
COPY frontend ./ 
COPY common ../common

RUN corepack enable && corepack prepare yarn@4.9.1 --activate \
  && yarn install \
  && yarn build

# Stage 2 — Build backend (keep same structure)
FROM node:20 AS backend-builder
WORKDIR /app/backend

# Copy backend and common into the SAME relative places as your repo
COPY backend ./
COPY common ../common

# Bring built frontend into backend/public
COPY --from=frontend-builder /app/frontend/dist ./public

RUN corepack enable && corepack prepare yarn@4.9.1 --activate \
  && yarn install 
RUN yarn build && ls -alh dist
# Stage 3 — Final image (match libc with builder; don't switch to alpine)
FROM node:20
WORKDIR /app/backend

# Copy built backend (including node_modules compiled for Debian)
COPY --from=backend-builder /app/backend ./
RUN mkdir -p /app/backend/src/data

EXPOSE 1798
CMD ["node", "dist/backend/src/index.js"]
