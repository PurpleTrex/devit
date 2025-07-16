@echo off
REM DevIT Development Setup Script for Windows

echo 🚀 Setting up DevIT development environment...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

REM Check if Rust is installed
cargo --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Rust is not installed. Please install Rust first.
    exit /b 1
)

echo ✅ All dependencies are installed!

REM Install Node.js dependencies
echo 📦 Installing Node.js dependencies...
npm install

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd frontend && npm install && cd ..

REM Set up environment files
if not exist .env (
    echo 🔧 Creating .env file...
    (
        echo # Database
        echo DATABASE_URL=postgres://devit:devit_password@localhost:5432/devit
        echo REDIS_URL=redis://localhost:6379
        echo.
        echo # MinIO/S3
        echo MINIO_ENDPOINT=localhost:9000
        echo MINIO_ACCESS_KEY=devit
        echo MINIO_SECRET_KEY=devit_password
        echo.
        echo # JWT
        echo JWT_SECRET=your-super-secret-jwt-key-change-in-production
        echo.
        echo # Server
        echo HOST=0.0.0.0
        echo PORT=8080
        echo.
        echo # Logging
        echo RUST_LOG=debug
    ) > .env
)

if not exist backend\.env (
    echo 🔧 Creating backend .env file...
    copy .env backend\.env
)

REM Start infrastructure services
echo 🐳 Starting infrastructure services (PostgreSQL, Redis, MinIO)...
docker-compose up -d postgres redis minio

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak

REM Build backend
echo 🦀 Building Rust backend...
cd backend && cargo build && cd ..

echo.
echo 🎉 DevIT development environment is ready!
echo.
echo 📋 Next steps:
echo   1. Run 'npm run dev' to start both frontend and backend
echo   2. Open http://localhost:3000 in your browser
echo   3. Backend API will be available at http://localhost:8080
echo.
echo 🔧 Infrastructure services:
echo   - PostgreSQL: localhost:5432
echo   - Redis: localhost:6379
echo   - MinIO Console: http://localhost:9001 (devit/devit_password)
echo.
echo 📚 Documentation: ./docs/
echo 🐳 Docker services: docker-compose ps

pause
