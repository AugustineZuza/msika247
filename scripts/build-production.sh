#!/bin/bash

echo "🚀 Building Msika247 for Production..."

# Clean previous build
rm -rf .next

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build application
echo "🏗️ Building application..."
npm run build

# Test build
echo "🧪 Testing production build..."
npm run start &
BUILD_PID=$!

# Wait a moment for server to start
sleep 5

# Test if server is responding
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Production build successful!"
    kill $BUILD_PID
else
    echo "❌ Production build failed!"
    kill $BUILD_PID
    exit 1
fi

echo "🎉 Ready for deployment!"
