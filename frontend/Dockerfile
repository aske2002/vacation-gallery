FROM node:20 AS builder
WORKDIR /app
COPY . .
RUN corepack enable && corepack prepare yarn@4.9.1 --activate && yarn install && yarn build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
