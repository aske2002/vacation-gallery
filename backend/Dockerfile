FROM node:21-alpine3.18


# Enable corepack and Yarn 4
RUN corepack enable && corepack prepare yarn@4.9.1 --activate

WORKDIR /app

# Copy source
COPY . .
RUN yarn install

# Build app
RUN yarn build

# Expose port and start
EXPOSE 1798
CMD ["node", "dist/index.js"]
