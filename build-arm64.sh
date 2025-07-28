#!/bin/bash

echo "🔧 Building backend (amd64)..."
docker buildx build --platform linux/amd64 -t backend:amd64 ./backend --load

echo "🔧 Building frontend (amd64)..."
docker buildx build --platform linux/amd64 -t frontend:amd64 ./frontend --load

echo "✅ Done! Now run: docker-compose up"