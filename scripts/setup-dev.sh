#!/usr/bin/env bash

# DevIT Development Setup Script

set -e

echo "🚀 Setting up DevIT development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust is not installed. Please install Rust first."
    exit 1
fi

echo "✅ All dependencies are installed!"

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Set up environment files
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cat > .env << EOF
# Database
DATABASE_URL=postgres://devit:devit_password@localhost:5432/devit
REDIS_URL=redis://localhost:6379

# MinIO/S3
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=devit
MINIO_SECRET_KEY=devit_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server
HOST=0.0.0.0
PORT=8080

# Logging
RUST_LOG=debug
EOF
fi

if [ ! -f backend/.env ]; then
    echo "🔧 Creating backend .env file..."
    cp .env backend/.env
fi

# Start infrastructure services
echo "🐳 Starting infrastructure services (PostgreSQL, Redis, MinIO)..."
docker-compose up -d postgres redis minio

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Build backend
echo "🦀 Building Rust backend..."
cd backend && cargo build && cd ..

echo ""
echo "🎉 DevIT development environment is ready!"
echo ""
echo "📋 Next steps:"
echo "  1. Run 'npm run dev' to start both frontend and backend"
echo "  2. Open http://localhost:3000 in your browser"
echo "  3. Backend API will be available at http://localhost:8080"
echo ""
echo "🔧 Infrastructure services:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo "  - MinIO Console: http://localhost:9001 (devit/devit_password)"
echo ""
echo "📚 Documentation: ./docs/"
echo "🐳 Docker services: docker-compose ps"
