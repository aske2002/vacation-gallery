#!/bin/bash

echo "🚀 Starting Vacation Gallery Backend Test..."

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo "❌ Please run this script from the vacation-gallery root directory"
    exit 1
fi

echo "📦 Installing backend dependencies..."
cd backend
npm install

echo "🏗️  Building backend..."
npm run build

echo "🚀 Starting backend server..."
echo "📍 Server will be available at: http://localhost:1798"
echo "📍 API will be available at: http://localhost:1798/api"
echo "📍 Health check: http://localhost:1798/api/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start
