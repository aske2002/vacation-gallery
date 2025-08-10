#!/bin/bash

echo "🔧 Building backend (amd64)..."
docker buildx build --platform linux/amd64 --no-cache -t backend:amd64 -f backend/Dockerfile . --load
echo "✅ Done! Now run: docker-compose up"