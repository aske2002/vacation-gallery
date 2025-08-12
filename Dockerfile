# Stage 1 — Build frontend
FROM node:20 
ENV PNPM_HOME="/pnpm"
ENV CI=true
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY . .
RUN ls
RUN pnpm install
RUN pnpm --filter vacation-gallery-backend build
RUN pnpm --filter vacation-gallery-frontend build

# Copy from frontend build directory to the backend public directory
RUN mkdir -p backend/dist/public
RUN cp -R frontend/dist/* backend/dist/public/

# Copy built backend (including node_modules compiled for Debian)
RUN mkdir -p /app/backend/data
EXPOSE 1798
CMD ["node", "backend/dist/index.js"]
